/**
 * Make any changes you need to make to the database here
 * 
 */
const path = require('path');
const uuid = require('uuid');

require(path.resolve('config/mongoMigrateConnection'));
const logger = require(path.resolve('config/logger'));
const AssetModel = require('../model/AssetModel');
const BrandModel = require('../model/BrandModel');

const assets = require('./sources/brand-assets-210421.json');

function toCamelCase(str){
  return str.split(' ').map(function(word,index){
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

async function up () {
  // Write migration here
  return Promise.all(assets.map(async (asset) => {
    const brandName = asset.filename.replace('_logo.png', '');
    const brands = await BrandModel.find({ name: { $regex: `^${brandName}$`, $options: 'i' } });
    if (brands.length === 0) {
      // then create new brand with name
      const newId = uuid(); console.log('[new Brand]', newId);
      const model = new BrandModel({ _id: newId, name: toCamelCase(brandName), images: [asset._id] });
      await model.save();
      return [model];
    }
    return Promise.all(brands.map((brand) => {
      brand.images = [asset._id];
      return brand.save();
    }));
  }))
  .then((arr) => {
    logger.info(`[MIGRATE] processed ${arr.length} Brand documents to Mongo!`);
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
