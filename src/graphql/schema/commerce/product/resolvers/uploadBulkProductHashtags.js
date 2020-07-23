const path = require('path');
const fs = require('fs');
const os = require('os');
const csv = require('csv-parser')
const { Validator } = require('node-input-validator');
const MIMEAssetTypes = require(path.resolve('src/lib/MIMEAssetTypes'));
const uuid = require('uuid/v4');
const promise = require('bluebird');
const lodash = require('lodash');

const repository = require(path.resolve('src/repository'));
const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));

const AWS = require('aws-sdk');
const { result } = require('lodash');

const { aws } = require(path.resolve('config'));
const { InventoryLogType, MarketType } = require(path.resolve('src/lib/Enums'));

const s3 = new AWS.S3();


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

module.exports = async (_, { file }) => {

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
      const productIds = csvContent.map(item => item.id);
      
      const productIndex = {};
      csvContent.forEach((item, i) => productIndex[item.id] = i);

      const data = {};
      csvContent.forEach(item => data[item.id] = item);

      let success = [], 
        failedProducts = [], 
        totalProducts = csvContent.length, 
        uploaded = csvContent.length, 
        failed = 0;

      return repository.product.getByIds(productIds)
        .then(products => {
          const productObj = {};
          products.forEach((product, i) => {
            productObj[product._id] = product;
          });

          const invalidIds = productIds.filter(productId => !productObj[productId]);

          failedProducts = {
            row: invalidIds.map(productId => productIndex[productId]), 
            errors: invalidIds.map(productId => `Not found the product with id "${productId}"`) 
          };

          failed = invalidIds.length;
          
          return Promise.all(products.map(product => {
            product.hashtags = data[product._id].hashtags.split(";").map(item => item.trim());
            product.sku = data[product._id].sku || product.sku;
            product.title = data[product._id].title || product.title;

            return product.save();
          }))
          .then(newProducts => {
            success = newProducts;
            return {
              success,
              failedProducts,
              totalProducts,
              uploaded,
              failed,
            };
          })          
        });
    })
    .catch((error) => {
      console.log('[error]', error)
      return {
        success: [],
        failedProducts: { row: [-1], errors: [error.message] },
        totalProducts: -1,
        uploaded: 0,
        failed: -1,
      };
    })
}
