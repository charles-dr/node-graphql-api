const path = require('path');
const uuid = require('uuid/v4');
const csv = require('csv-parser');
const { Validator } = require('node-input-validator');

const MIMEAssetTypes = require(path.resolve('src/lib/MIMEAssetTypes'));
const { assets: { types: assetTypes } } = require(path.resolve('config'));

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();


const activity = {
  parseCSVContent: async (readStream) => {
    const results = [];
    return new Promise((resolve, reject) => {
      readStream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          resolve(results);
        });
    })
  },
  composeBannerData: (csvRow) => {
    // lowercase the key to get rid of confusion.
    Object.keys(csvRow).forEach(key => {
      csvRow[key.toLowerCase()] = csvRow[key];
    });

    const banner = {
      identifier: csvRow.identifier,
      name: csvRow.banner_name,
      page: csvRow.banner_page,
      sitePath: csvRow.banner_site_path,

      adType: csvRow.ad_type.replace('-', '_').trim().toUpperCase(),
      size: {
        width: csvRow.banner_size.split('x')[0],
        height: csvRow.banner_size.split('x')[1],
      },
      type: (csvRow.banner_type || "PNG").trim().toUpperCase(),
      layout: csvRow.banner_layout.trim().toUpperCase(),
    };
    banner.time = function(strTime = "") {
      const arr = strTime.split(":");
      const h = Number(arr[0] || "0");
      const m = Number(arr[1] || "0");
      const s = Number(arr[2] || "0");
      return h * 3600 + m * 60 + s;
    }(csvRow.timing_duration);
    
    banner.assets = function() {
      const length = 10;
      const assets = Array.from(new Array(length), (x,i) => i).map((x, i) => ({
        image: csvRow[`asset_url${i === 0 ? "" : i}`] || null,
        image4Mobile: csvRow[`mobile_asset_url${i === 0 ? "" : i}`] || null,
        link: csvRow[`redirection_link${i === 0 ? "" : i}`] || null,
      })).filter(item => item.image);
      return assets;
    }();
    return banner;
  }
}


module.exports = async (_, { file }, { dataSources: { repository }}) => {
  const { createReadStream, mimetype, filename } = await file; 
  const fileStream = createReadStream();

	const size = 100;
  const validator = new Validator({ mimetype, size }, {
		mimetype: 'required',
		size: 'required'
  });
  
  validator.addPostRule(async (input) => {
    const detectedType = MIMEAssetTypes.detect(input.inputs.mimetype);
    if (!detectedType || detectedType.type !== assetTypes.CSV) {
      validator.addError('mimetype', 'custom', '"Mutation.uploadBulkBanners" accepts CSV file only!');
    }
  });

  return validator.check()
    .then(matched => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
      return activity.parseCSVContent(fileStream);
    })
    .then(async (csvRows) => {
      const result = {
        total: csvRows.length,
        success: 0,
        failed: 0,
        failedList: { row: [], errors: [] }
      };

      return Promise.all(csvRows.map((csvRow, i) => Promise.all([
        csvRow._id ? repository.banner.getById(csvRow._id) : null,
        repository.banner.getOne({ identifier: csvRow.identifier }), 
      ])
        .then(([bannerById, bannerByIdtf]) => {
          const banner = bannerById || bannerByIdtf;
          const bannerData = activity.composeBannerData(csvRow);
                    
          if (banner) {
            // update it.
            Object.keys(bannerData).forEach(key => {
              banner[key] = bannerData[key];
            });
            return banner.save();
          } else {
            // create new one
            return repository.banner.create({ ...bannerData, _id: uuid() });
          }
        })
        .then(banner => {
          result.success ++;
        })
        .catch(error => {
          result.failed ++;
          result.failedList.row.push(i);
          result.failedList.errors.push(error.message);
        })
      ))
      .then(() => result)
    })
    .catch(error => {
      console.log('[error]', error);
      return {
        total: -1,
        success: 0,
        failed: -1,
        failedList: { row: [-1], errors: [error.message] },
      };
    })
}

