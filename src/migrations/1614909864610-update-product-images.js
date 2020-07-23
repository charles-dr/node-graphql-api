const path = require('path');
const csv = require('csv-parser');
const fs = require('fs');
const uuid = require('uuid/v4');

require(path.resolve('config/mongoMigrateConnection'));

const logger = require(path.resolve('config/logger'));
const ProductCategoryModel = require('../model/ProductCategoryModel');
const AssetModel = require('../model/AssetModel');
const csvPath = path.resolve('src/migrations/sources/productcategories-China-Xiufu.csv');

const mimeTypes = {
  png: 'image/png',
  jpg: 'image/jpg',
};

async function parseCSVContent() {
  const results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results));
  })
}


/**
 * Make any changes you need to make to the database here
 */
async function up () {
  // Write migration here
  const CDN_PATH = "https://cdn-stage.shoclef.com/";

  return parseCSVContent()
    .then(rows => {
      return wImages = rows.filter(row => row.image_url);
    })
    .then(rows => {
      const urls = rows.map(row => row.image_url).filter((value, index, self) => self.indexOf(value) === index);
      return Promise.all(urls.map(async url => {
        const path = url.replace(CDN_PATH, '');
        const ext = url.substr(url.toString().lastIndexOf('.') + 1);
        const itemsWURL = rows.filter(row => row.image_url === url);
        const categories = await ProductCategoryModel.find({ _id: { $in: itemsWURL.map(item => item._id) } });
        const assetByPath = await AssetModel.findOne({ path });
        if (assetByPath) {
          await Promise.all(categories.map(category => {
            category.image = assetByPath._id; return category.save();
          }))
        } else {
          const assets = await AssetModel.find({ _id: {$in: itemsWURL.map(item => item.image)} });
          if (assets.length) {
            await Promise.all(categories.map(category => {
              category.image = assets[0]._id; return category.save();
            }))
          } else {
            // create a new asset
            const assetData = {
              _id: uuid(),
              status: "UPLOADED",
              owner: "a0f952da-815b-43d8-ba9f-4c3348b758f7",
              path,
              url,
              type: "IMAGE",
              size: 1000,
              mimetype: mimeTypes[ext] || 'image/jpg',
            };
            const asset = await AssetModel.create(assetData);
            await Promise.all(categories.map(category => {
              category.image = asset._id; return category.save();
            }))
          }
        } 
      }))
    })
    .then((rows) => {
      logger.info(`[MIGRATE] updated ${rows.length} Asset documents to Mongo!`);
    })
    .catch((error) => {
      logger.error(error.message);
      throw error;
    });
}

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
async function down () {
  // Write migration here

}

module.exports = { up, down };
