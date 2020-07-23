const path = require('path');

require(path.resolve('config/mongoMigrateConnection'));

const logger = require(path.resolve('config/logger'));
const countryModel = require('../model/CountryModel');

const countries = require('./sources/countries-source.json');

async function up() {
  return countryModel.insertMany(countries)
    .then((docs) => {
      logger.info(`[MIGRATE] added ${docs.length} Country documents to Mongo!`);
    })
    .catch((error) => {
      logger.error(error.message);
      throw error;
    });
}

async function down() {
  return countryModel.remove({ name: /.*/ })
    .then((res) => {
      logger.info(`[MIGRATE] removed ${res.deletedCount} Country documents from Mongo!`);
    })
    .catch((error) => {
      logger.error(error.message);
      throw error;
    });
}

module.exports = { up, down };
