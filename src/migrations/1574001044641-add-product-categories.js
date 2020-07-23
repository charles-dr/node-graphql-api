/* eslint-disable consistent-return */
const path = require('path');
const Promise = require('bluebird');

require(path.resolve('config/mongoMigrateConnection'));

const logger = require(path.resolve('config/logger'));
const ProductCategoryModel = require('../model/ProductCategoryModel');

const categories = require('./sources/product-categories');

async function up() {
  let insertCategories = categories
    .filter(({ subCategory, subSubCategory }) => !subCategory && !subSubCategory)
    .map(({
      category, subCategory, subSubCategory, ...document
    }) => new ProductCategoryModel({
      ...document, name: category, level: 1,
    }));

  insertCategories = [].concat(insertCategories, categories
    .filter(({ subCategory, subSubCategory }) => subCategory && !subSubCategory)
    .map(({
      category, subCategory, subSubCategory, ...document
    }) => {
      const parentCategory = categories.filter((cat) => (
        cat.category === category && !cat.subCategory && !cat.subSubCategory
      ))[0];

      return new ProductCategoryModel(
        {
          ...document, name: subCategory, parent: parentCategory._id, level: 2,
        },
      );
    }));

  insertCategories = [].concat(insertCategories, categories
    .filter(({ subSubCategory }) => subSubCategory)
    .map(({ subCategory, subSubCategory, ...document }) => {
      const parentCategory = categories.filter((cat) => (
        cat.subCategory === subCategory && !cat.subSubCategory
      ))[0];

      return new ProductCategoryModel(
        {
          ...document, name: subSubCategory, parent: parentCategory._id, level: 3,
        },
      );
    }));

  await Promise.map(
    insertCategories,
    async (document) => document.save(),
    { concurrency: 1 },
  )
    .then((docs) => {
      logger.info(`[MIGRATE] added ${docs.length} LiveStream Category documents to Mongo!`);
    })
    .catch((error) => {
      logger.error(error.message);
      throw error;
    });
}

async function down() {
  return ProductCategoryModel.remove({ name: /.*/ })
    .then((res) => {
      logger.info(`[MIGRATE] removed ${res.deletedCount}  Product Category documents from Mongo!`);
    })
    .catch((error) => {
      logger.error(error.message);
      throw error;
    });
}

module.exports = { up, down };
