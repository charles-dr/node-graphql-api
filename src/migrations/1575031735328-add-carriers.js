const path = require('path');

require(path.resolve('config/mongoMigrateConnection'));

const logger = require(path.resolve('config/logger'));
const carrierModel = require('../model/CarrierModel');

const carriers = require('./sources/carriers-source.json');

async function up() {
  return carrierModel.insertMany(carriers)
    .then((docs) => {
      logger.info(`[MIGRATE] added ${docs.length} Carrier documents to Mongo!`);
    })
    .catch((error) => {
      logger.error(error.message);
      throw error;
    });
}

async function down() {
  return carrierModel.remove({ name: /.*/ })
    .then((res) => {
      logger.info(`[MIGRATE] removed ${res.deletedCount} Carrier documents from Mongo!`);
    })
    .catch((error) => {
      logger.error(error.message);
      throw error;
    });
}

module.exports = { up, down };
