/* eslint-disable consistent-return */
const path = require('path');
const uuid = require('uuid');
const Promise = require('bluebird');

require(path.resolve('config/mongoMigrateConnection'));

const logger = require(path.resolve('config/logger'));
const ProductCategoryModel = require('../model/ProductCategoryModel');

const categories = require('./sources/product-categories');

async function up() {
  const rawAssets = [];

  categories.forEach((c) => {
    if (c.order) {
      rawAssets.push(c);
    }
  });

  await Promise.map(
    rawAssets,
    async (productCategory) => ProductCategoryModel.update({ _id: productCategory._id }, { $set: { order: productCategory.order } }),
    { concurrency: 1 },
  )
    .then((docs) => {
      logger.info(`[MIGRATE] added order to ${docs.length} Product Category documents in Mongo!`);
    })
    .catch((error) => {
      logger.error(error.message);
      throw error;
    });
}

async function down() {
  return ProductCategoryModel.find({ order: { $exists: true } })
    .then((productCategories) => Promise.all(productCategories.map((productCategory) => {
      delete productCategory.order;
      return productCategory.save();
    })))
    .then((res) => {
      logger.info(`[MIGRATE] removed order from ${res.length} Product Category documents in Mongo!`);
    });
}

module.exports = { up, down };
