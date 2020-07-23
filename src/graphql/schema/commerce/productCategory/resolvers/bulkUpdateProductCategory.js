const path = require('path');
const fs = require('fs');
const os = require('os');
const csv = require('csv-parser')
const { Validator } = require('node-input-validator');
const MIMEAssetTypes = require(path.resolve('src/lib/MIMEAssetTypes'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

const parseCSVContent = (readStream) => {
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

module.exports = async (_, { file }, { user, dataSources: { repository } }) => {

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
      const csvContent = await parseCSVContent(fileStream);
      const categoryIds = csvContent.map(item => item._id);
      
      const categoryIndex = {};
      csvContent.forEach((item, i) => categoryIndex[item._id] = i);

      const data = {};
      csvContent.forEach(item => data[item._id] = item);

      let failedList = [], 
        total = csvContent.length, 
        updated = csvContent.length, 
        failed = 0;

      return repository.productCategory.findByIds(categoryIds)
        .then(categories => {
          const categoryObj = {};
          categories.forEach((category, i) => {
            categoryObj[category._id] = category;
          });

          const invalidIds = categoryIds.filter(categoryId => !categoryObj[categoryId]);

          failedList = {
            row: invalidIds.map(categoryId => categoryIndex[categoryId]), 
            errors: invalidIds.map(categoryId => `Not found the product category with id "${categoryId}"`) 
          };

          failed = invalidIds.length;
          updated = total - failed;
          
          return Promise.all(categories.map(category => {
            category.hashtags = data[category._id]["Chinese Hashtag"].split(";").map(item => item.trim());

            return category.save();
          }))
          .then(newCategories => {
            return {
              total,
              updated,
              failed,
              failedList,
            };
          })          
        });
    })
    .catch((error) => {
      console.log('[error]', error)
      return {
        total: -1,
        updated: 0,
        failed: -1,
        failedList: {row: [-1], errors: [error.message]},
      };
    })
}
