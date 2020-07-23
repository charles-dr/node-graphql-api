/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
const path = require('path');
const NodeCache = require('node-cache');
const async = require('async');

const BaseRobot = require('./BaseRobot');

const logger = require(path.resolve('config/logger'));
const BrandModel = require(path.resolve('src/model/BrandModel'));
const repository = require(path.resolve('src/repository'));
const { translate_ggl: translate } = require(path.resolve('src/lib/TranslateService'));

const cache = new NodeCache();
const CONFIG_KEY = 'TranslateProductCategory';

const activity = {
  start: async () => {
    const config = cache.get(CONFIG_KEY);
    const { position: skip, limit } = config;
    const where = { $or: [
      { "translations": { $exists: false } },
      { "translations.es": { $exists: false } },
    ] };

    const total = await BrandModel.countDocuments(where);

    if (!total) {
      logger.info(`[TranslateBrand] All product categories had been translated.`);
      cache.set(CONFIG_KEY, { ...config, running: false });
      return;
    }

    const brands = await BrandModel.find(where, null, { limit, skip, sort: { name: 1} });


    // mark the bot as running.
    cache.set(CONFIG_KEY, { ...config, running: true });
    
    // const total = await ProductModel.countDocuments(where);
    logger.info(`[TranslateBrand][${skip}-${skip + brands.length}/${total}] Start!`);

    const batch = 10;
    const iterN = Math.ceil(brands.length / batch);
        
    for (let i = 0; i < iterN; i++) {
      await Promise.all(brands.slice(i * batch, (i + 1) * batch).map(brand => activity.translateBrand(brand, repository)));
      logger.info(`[TranslateBrand][<${i * batch}-${(i + 1) * batch}>/${brands.length}/${total}] done!`);
    }

    cache.set(CONFIG_KEY, {
      ...config,
      position: 0,
      running: true,
    });

    activity.start();
    logger.info(`[TranslateBrandRobot][${skip}-${skip + brand.length}] Finished!`);
  },
  translateBrand: async (brand, repository) => {
    return translate(brand.name)
      .then(translations => {
        brand.translations = translations;
        return brand.save();
      });
  },
};

module.exports = class TranslateProductsRobot extends BaseRobot {
  constructor() {
    super(30 * 60 * 1009);
    cache.set(CONFIG_KEY, { position: 0, limit: 100, running: false });
  }

  execute() {
    return Promise.all([
      activity.start(),
    ])
      .then(() => {
        super.execute();
      });
  }
};
