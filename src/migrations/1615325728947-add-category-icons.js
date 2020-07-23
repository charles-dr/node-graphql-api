const path = require('path');
const uuid = require('uuid');
require(path.resolve('config/mongoMigrateConnection'));
const logger = require(path.resolve('config/logger'));
const AssetModel = require('../model/AssetModel');
const assets = require('./sources/category-icons-210310.json');


/**
 * Make any changes you need to make to the database here
 */
async function up () {
  // Write migration here
  const assetIds = assets.map(it => it._id);
  return AssetModel.find({ _id: {$in: assetIds} })
    .then(docs => AssetModel.insertMany(assets.filter(it => !docs.map(doc => doc._id).includes(it._id))))
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
