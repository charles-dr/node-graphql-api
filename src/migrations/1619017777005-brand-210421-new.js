/**
 * Make any changes you need to make to the database here
 */
 const path = require('path');
 
 require(path.resolve('config/mongoMigrateConnection'));
 const logger = require(path.resolve('config/logger'));
 const BrandModel = require('../model/BrandModel');

const brands = require('./sources/brand-210421-new.json');


async function up () {
  // Write migration here
  return Promise.all(brands.map((brand) => BrandModel.findOne({ _id: brand._id }).then((exists) => {
    if (exists) return exists;
    brand.createdAt = new Date(brand.createdAt['$date']);
    const model = new BrandModel(brand);
    return model.save();
  })))
  .then((rows) => {
    logger.info(`[MIGRATE] processed ${rows.length} Brand documents to Mongo!`);
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
