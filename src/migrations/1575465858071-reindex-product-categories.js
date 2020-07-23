/* eslint-disable consistent-return */
const path = require('path');

require(path.resolve('config/mongoMigrateConnection'));

const logger = require(path.resolve('config/logger'));
const ProductCategoryModel = require('../model/ProductCategoryModel');
const ProductCategoryRepository = require('../repository/ProductCategoryRepository');

async function up() {
  const repository = new ProductCategoryRepository(ProductCategoryModel);
  return repository.reindex();
}

async function down() {
  logger.info('No need any down for reindex product category');
}

module.exports = { up, down };
