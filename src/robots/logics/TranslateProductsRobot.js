/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
const path = require('path');
const NodeCache = require('node-cache');
const async = require('async');

const BaseRobot = require('./BaseRobot');

const logger = require(path.resolve('config/logger'));
const ProductModel = require(path.resolve('src/model/ProductModel'));
const repository = require(path.resolve('src/repository'));
const { translate_ggl: translate } = require(path.resolve('src/lib/TranslateService'));

const cache = new NodeCache();
const CONFIG_KEY = 'TranslateProduct';

const activity = {
  start: async () => {
    console.log('[Product] start');
    const config = cache.get(CONFIG_KEY);
    
    const { position: skip, limit } = config;
    const where = { translated: 0, isDeleted: false };
    const total = await ProductModel.countDocuments(where);
    if (!total) {
      logger.info(`[TranslateProduct] All products had been translated.`);
      cache.set(CONFIG_KEY, { ...config, running: false });
      return;
    }

    const products = await ProductModel.find(where, null, { limit, skip, sort: { title: 1} });


    // mark the bot as running.
    cache.set(CONFIG_KEY, { ...config, running: true });
    
    // const total = await ProductModel.countDocuments(where);
    logger.info(`[TranslateProduct][${skip}-${skip + products.length}/${total}] Start!`);

    const batch = 10;
    const iterN = Math.ceil(products.length / batch);
        
    for (let i = 0; i < iterN; i++) {
      await Promise.all(products.slice(i * batch, (i + 1) * batch).map(product => activity.translateProduct(product, repository)));
      logger.info(`[TranslateProduct][<${i * batch}-${(i + 1) * batch}>/${products.length}/${total}] done!`);
    }

    cache.set(CONFIG_KEY, {
      ...config,
      position: 0,
      running: true,
    });

    activity.start();
  },
  translateProduct: async (product, repository) => {
    return repository.productTranslation.getByProduct(product.id)
      .then(async productTranslation => {
        if (productTranslation) {
          product.translated = product.translated ? product.translated : Date.now();
          return product.save();
        }
        return Promise.all([
          translate(product.title),
          translate(product.description),
        ])
          .then(async ([title, description]) => {
            await repository.productTranslation.addNewProduct({ product: product.id, title, description });
            product.translated = Date.now();
            product.freeDeliveryTo = product.freeDeliveryTo.filter(it => !!it);
            await product.save();
          });
      })
  },
};

module.exports = class TranslateProductsRobot extends BaseRobot {
  constructor() {
    super(17 * 60 * 1009);
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
