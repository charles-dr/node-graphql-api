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
  composeReviewData: (csvRow) => {
    // lowercase the key to get rid of confusion.
    Object.keys(csvRow).forEach(key => {
      csvRow[key.toLowerCase()] = csvRow[key];
    });

    const { order_id, user_id, rating, message, lang, createdAt } = csvRow;

    const review = {
      tag: activity.generateTag(csvRow),
      order_id,
      user: user_id,
      rating: Number(rating).toFixed(1), 
      message,
      lang: lang.toUpperCase(),
      createdAt: createdAt || new Date(),
    };
    
    return review;
  },
  generateTag: ({ target = 'Product', target_id }) => {
    target = target.charAt(0).toUpperCase() + target.slice(1).toLowerCase();
    return `${target}:${target_id}`;
  },
  checkReviewExists: async (csvRow, repository) => {
    return Promise.all([
      csvRow._id ? repository.rating.getById(csvRow._id) : null,
      csvRow.target_id ? repository.rating.load(activity.generateTag(csvRow), csvRow.user_id) : null,
    ])
      .then(([ itemById, itemByTag ]) => itemById || itemByTag);
  },
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
      validator.addError('mimetype', 'custom', '"Mutation.uploadBulkReviews" accepts CSV file only!');
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

      return Promise.all(csvRows.map((csvRow, i) => activity.checkReviewExists(csvRow, repository)
        .then((review) => {
          const reviewData = activity.composeReviewData(csvRow);

          if (review) {
            // update it.
            Object.keys(reviewData).forEach(key => {
              review[key] = reviewData[key];
            });
            return review.save();
          } else {
            // create new one
            return repository.rating.create(reviewData);
          }
        })
        .then(review => {
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

