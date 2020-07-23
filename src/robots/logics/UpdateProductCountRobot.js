/* eslint-disable no-param-reassign */
const path = require('path');
const BaseRobot = require('./BaseRobot');
const NodeCache = require('node-cache');
const cache = new NodeCache();

const logger = require(path.resolve('config/logger'));
const ProductService = require(path.resolve('src/lib/ProductService'));
const ProductCategoryModel = require(path.resolve('src/model/ProductCategoryModel'));
const BrandModel = require(path.resolve('src/model/BrandModel'));

const CATEGORY_CONFIG = 'UpdateProductCountRobot.Category';
const BRAND_CONFIG = 'UpdateProductCountRobot.Brand';

const activity = {
  updateProductCategory: async () => {
    const config = cache.get(CATEGORY_CONFIG);
    const { position: skip, limit } = config;
    return Promise.all([
      ProductCategoryModel.find({}, null, { limit, skip, sort: { createdAt: 1 } }),
      ProductCategoryModel.countDocuments({}),
    ])
      .then(async ([categories, total]) => {
        await ProductService.updateProductCountInCategories(categories.map(category => category._id));
        config.position = skip + categories.length < total ? skip + limit : 0;
        cache.set(CATEGORY_CONFIG, config);
        // logger.info(`[UpdateProductCountRobot][Category][${skip}-${skip + categories.length}] was executed!`);
      })
  },
  updateBrands: async () => {
    const config = cache.get(BRAND_CONFIG);
    const { position: skip, limit } = config;
    return Promise.all([
      BrandModel.find({}, null, { limit, skip, sort: { createdAt: 1 } }),
      BrandModel.countDocuments({}),
    ])
      .then(async ([brands, total]) => {
        await Promise.all(brands.map(brand => ProductService.updateProductCountInBrand(brand._id)));
        config.position = skip + brands.length < total ? skip + limit : 0;
        cache.set(BRAND_CONFIG, config);
        // logger.info(`[UpdateProductCountRobot][Brand][${skip}-${skip + brands.length}] was executed!`);
      })
  },
}

module.exports = class UpdateProductCountRobot extends BaseRobot {
  constructor() {
    super(29 * 60 * 1009);
    cache.set(CATEGORY_CONFIG, { position: 0, limit: 100 });
    cache.set(BRAND_CONFIG, { position: 0, limit: 300 });
  }

  execute() {
    return Promise.all([
      activity.updateProductCategory(),
      activity.updateBrands(),
    ])
      .then(() => {
        super.execute();
        // logger.info(`[UpdateProductCountRobot] was executed!`);
      });
  }
};