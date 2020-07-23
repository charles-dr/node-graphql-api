const path = require('path');

require(path.resolve('config/mongoMigrateConnection'));
const logger = require(path.resolve('config/logger'));
const sortPriceRateModel = require('../model/SortPriceRateModel');
const rates = require('./sources/sortpricerates.json');

/**
 * Make any changes you need to make to the database here
 */
async function up () {
  // Write migration here
  return sortPriceRateModel.insertMany(rates)
    .then((docs) => {
      logger.info(`[MIGRATE] added ${docs.length} Country documents to Mongo!`);
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
  return sortPriceRateModel.remove({ name: /.*/ })
    .then((res) => {
      logger.info(`[MIGRATE] removed ${res.deletedCount} Country documents from Mongo!`);
    })
    .catch((error) => {
      logger.error(error.message);
      throw error;
    });
}

module.exports = { up, down };
