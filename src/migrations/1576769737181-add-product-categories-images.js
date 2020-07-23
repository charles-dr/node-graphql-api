/* eslint-disable consistent-return */
const path = require('path');
const uuid = require('uuid');
const Promise = require('bluebird');

require(path.resolve('config/mongoMigrateConnection'));

const logger = require(path.resolve('config/logger'));
const { cdn } = require(path.resolve('config'));
const ProductCategoryModel = require('../model/ProductCategoryModel');
const AssetModel = require('../model/AssetModel');

const categories = require('./sources/product-categories');

const directory = 'product-categories';

async function up() {
  const rawAssets = {};

  categories.forEach((c) => {
    if (c.imgFile && !rawAssets[c.imgFile]) {
      rawAssets[c.imgFile] = {
        productCategory: c._id,
        asset: new AssetModel({
          _id: uuid(),
          owner: 'system',
          url: `${cdn.appAssets}/${directory}/${c.imgFile}`,
          path: `${directory}/${c.imgFile}`,
          status: 'UPLOADED',
          type: 'IMAGE',
          size: 1000,
          mimetype: 'image/jpeg',
        }),
      };
    }
  });

  await Promise.map(
    Object.values(rawAssets),
    async (raw) => raw.asset.save()
      .then((asset) => ProductCategoryModel.update({ _id: raw.productCategory }, { $set: { image: asset._id } })),
    { concurrency: 1 },
  )
    .then((docs) => {
      logger.info(`[MIGRATE] added ${docs.length} Product Category Assets documents to Mongo!`);
    })
    .catch((error) => {
      logger.error(error.message);
      throw error;
    });
}

async function down() {
  return ProductCategoryModel.find({ image: { $exists: true } })
    .then((products) => Promise.all(products.map((product) => AssetModel.remove({ _id: product.image })
      .then(() => {
        delete product.image;
        return product.save();
      }))))
    .then((res) => {
      logger.info(`[MIGRATE] removed ${res.legth} Product Category Assets documents from Mongo!`);
    });
}

module.exports = { up, down };
