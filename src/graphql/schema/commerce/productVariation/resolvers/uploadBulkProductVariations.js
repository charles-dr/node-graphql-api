const path = require('path');
const fs = require('fs');
const os = require('os');
const csv = require('csv-parser')
const { Validator } = require('node-input-validator');
const MIMEAssetTypes = require(path.resolve('src/lib/MIMEAssetTypes'));

const repository = require(path.resolve('src/repository'));


const parsecsvArray = (readStream) => {
  const results = [];
  return new Promise((resolve, reject) => {
    readStream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results);
      });
  })
}

const transformCSVRow = (row) => {
  // transform categories to array
  row.categories = row.categoryid.split(';').map(item => item.trim()).filter(item => item);

  // convert values to array
  const valueKeys = Object.keys(row).filter(key => key.includes('values.'));
  row.values = [];
  valueKeys.forEach(key => {
    const index = Number(key.replace('values.', '').trim());
    row[key] ? row.values[index] = row[key] : null;
  })
  return row;
}

const processProductVariation = async (row, repository) => {
  let productVariation;
  if (row._id) productVariation = await repository.productVariation.getById(row._id);

  if (productVariation) {
    // update product variation
    productVariation.name = row.name;
    productVariation.description = row.description;
    productVariation.values = row.values;
    productVariation.keyName = row.name;
    productVariation.displayName = row.displayName;
    productVariation.categories = row.categories;
    return productVariation.save();
  } else {
    // create new product variation.
    const data = {
      name: row.name,
      description: row.description,
      values: row.values,
      keyName: row.name, // name = keyname for now.
      displayName: row.displayName,
      categories: row.categories,
    };

    // check if keyName is duplicated or not.
    const pdByKeyName = await repository.productVariation.getByKeyName(data.keyName);
    if (pdByKeyName) throw new Error("Name already exists!");

    productVariation = await repository.productVariation.create(data);
  }
}



module.exports = async (_, { file }, { dataSources: { repository }, user }) => {

  const { createReadStream, mimetype, filename } = await file; console.log('[file]', mimetype, filename);
  const fileStream = createReadStream();

	const size = 100;
  const validator = new Validator({ mimetype, size }, {
		mimetype: 'required',
		size: 'required'
  });
  
  validator.addPostRule(async (input) => {
		if (!MIMEAssetTypes.detect(input.inputs.mimetype)) {
			validator.addError('mimetype', 'custom', 'API does not support this mimetype');
    }
  });

  return validator.check()
    .then(matched => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(async () => {
      const csvArray = await parsecsvArray(fileStream);

      let total = csvArray.length;
      let success = 0;
      let failed = 0; 
      let failedList = { row: [], errors: [] };

      await Promise.all(csvArray.map(async (csvItem, i) => {
        transformCSVRow(csvItem);
        try {
          await processProductVariation(csvItem, repository);
          success ++;
        } catch (e) {
          failed ++;
          failedList.row.push(i);
          failedList.errors.push(e.message);
        }
      }));
      return {
        total, success, failed, failedList,
      };
    })
    .catch((error) => {
      return {
        total: -1,
        success: 0,
        failed: -1,
        failedList: {row: [-1], errors: [error.message]},
      };
    })
}
