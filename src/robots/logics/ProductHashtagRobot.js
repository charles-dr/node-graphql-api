/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
const path = require('path');
const NodeCache = require('node-cache');
const async = require('async');
const striptags = require('striptags');

const BaseRobot = require('./BaseRobot');

const logger = require(path.resolve('config/logger'));
const ProductModel = require(path.resolve('src/model/ProductModel'));
const ProductCategoryModel = require(path.resolve('src/model/ProductCategoryModel'));
const BrandModel = require(path.resolve('src/model/BrandModel'));

const repository = require(path.resolve('src/repository'));
const { extractKeyword } = require(path.resolve('src/lib/PythonService'));

const cache = new NodeCache();
const CONFIG_KEY = 'CheckProductHashtags';

const activity = {
  start: async () => {
    console.log('[Product][Keyword] start');
    const config = cache.get(CONFIG_KEY);
    
    const { position: skip, limit } = config;
    const where = { "hashtags.9": { $exists: false }, isDeleted: false };

    const total = await ProductModel.countDocuments(where);
    if (!total) {
      logger.info(`[ProductHashtags] All products had been translated.`);
      cache.set(CONFIG_KEY, { ...config, running: false });
      return;
    }

    const randomSkip = Math.max(Math.floor((total - limit / 2) * Math.random()), 0);
    const products = await ProductModel.find(where, null, { limit, skip: randomSkip, sort: { title: 1} });

    // mark the bot as running.
    cache.set(CONFIG_KEY, { ...config, running: true });
    
    // const total = await ProductModel.countDocuments(where);
    logger.info(`[ProductHashtags][${skip}-${skip + products.length}/${total}] Start!`);

    const batch = 20;
    const iterN = Math.ceil(products.length / batch);

    for (let i = 0; i < iterN; i++) {
      await Promise.all(products.slice(i * batch, (i + 1) * batch).map((product, j) => activity.processProduct(product, repository, j)));
      logger.info(`[ProductHashtags][<${i * batch}-${(i + 1) * batch}>/${products.length}/${total}] done!`);
    }

    cache.set(CONFIG_KEY, {
      ...config,
      position: 0,
      running: true,
    });

    activity.start();
  },
  processProduct: (product, repository, index) => {
    const DELIMITER = ',';
    let strArr = [];
    let mustKeywords = [];
    if (product) strArr.push([product.title, striptags(product.description)].join(DELIMITER));

    return Promise.all([
      repository.productCategory.getById(product.category),
      repository.brand.getById(product.brand),
    ])
      .then(([category, brand]) => {
        if (category) {
          mustKeywords.push(category.name);
          strArr.push([...category.hashtags, category.name].join(DELIMITER));
        }
        if (brand) {
          mustKeywords.push(brand.name);
          strArr.push([brand.hashtags, ...brand.name].join(DELIMITER));
        }

        return strArr.join(DELIMITER);
      })
      .then(src_string => extractKeyword(src_string, index))
      .then(hashtags => {
        hashtags = hashtags.concat(mustKeywords).filter((hashtag, i, self) => self.indexOf(hashtag) === i);
        if (hashtags.length < 10) {
          hashtags[9] = '___';
        }
        product.hashtags = hashtags;
        return product.save();
      });
  },
};

module.exports = class ProductHashtagRobot extends BaseRobot {
  constructor() {
    super(35 * 60 * 1009);
    cache.set(CONFIG_KEY, { position: 0, limit: 100, running: false });
  }

  execute() {
    const config = cache.get(CONFIG_KEY);
    if (config.running) return;
    return Promise.all([
      activity.start(),
    ])
      .then(() => {
        super.execute();
      });
  }
};
