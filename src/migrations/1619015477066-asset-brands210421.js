/**
 * Make any changes you need to make to the database here
 */
const path = require('path');

require(path.resolve('config/mongoMigrateConnection'));
const logger = require(path.resolve('config/logger'));
const AssetModel = require('../model/AssetModel');

const assets = require('./sources/brand-assets-210421.json');

async function up () {
  // Write migration here
  return Promise.all(assets.map((asset) => AssetModel.findOne({ _id: asset._id }).then((exists) => {
    if (exists) return exists;
    asset.createdAt = new Date(asset.createdAt['$date']);
    const model = new AssetModel(asset);
    return model.save();
  })))
  .then((rows) => {
    logger.info(`[MIGRATE] added ${rows.length} Asset documents to Mongo!`);
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
