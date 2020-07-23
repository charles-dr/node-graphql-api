const path = require('path');
const uuid = require('uuid');
require(path.resolve('config/mongoMigrateConnection'));
const logger = require(path.resolve('config/logger'));
const ProductCategoryModel = require('../model/ProductCategoryModel');
const mapObj = require('./sources/category-icon-map.json');

/**
 * Make any changes you need to make to the database here
 */
async function up () {
  // Write migration here
  return ProductCategoryModel.find({ _id: {$in: Object.keys(mapObj)} })
    .then(categories => Promise.all(categories.map(category => {
      if (mapObj[category._id] !== undefined) {
        category.icon = mapObj[category._id];
        return category.save();
      } else {
        return category;
      }
    })))
    .then(docs => {
      logger.info(`[MIGRATE] updated ${docs.length} Theme documents to Mongo!`);
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
