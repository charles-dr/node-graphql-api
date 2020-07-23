const path = require('path');

require(path.resolve('config/mongoMigrateConnection'));

const logger = require(path.resolve('config/logger'));
const brandModel = require('../model/BrandModel');

const dirtyBrands = require('./sources/brands-source.json');

async function up() {
  const brands = [];
  const duplicates = [];

  dirtyBrands.forEach((brand) => {
    if (!brands.some((dBrand) => dBrand.name.toLowerCase() === brand.name.toLowerCase())) {
      brands.push(brand);
    } else {
      duplicates.push(brand);
    }
  });

  logger.warn(`Found ${dirtyBrands.length - brands.length} duplicates "${duplicates.map((item) => item.name).join(', ')}"`);

  return brandModel.insertMany(brands)
    .then((docs) => {
      logger.info(`[MIGRATE] added ${docs.length} Brand documents to Mongo!`);
    })
    .catch((error) => {
      logger.error(error.message);
      throw error;
    });
}

async function down() {
  return brandModel.remove({ name: /.*/ })
    .then((res) => {
      logger.info(`[MIGRATE] removed ${res.deletedCount} Brand documents from Mongo!`);
    })
    .catch((error) => {
      logger.error(error.message);
      throw error;
    });
}

module.exports = { up, down };
