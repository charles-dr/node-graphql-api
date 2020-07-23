const path = require('path');
const BaseRobot = require('./BaseRobot');
const NodeCache = require('node-cache');
const logger = require(path.resolve('config/logger'));
const ProductAttributesModel = require(path.resolve('src/model/ProductAttributesModel'));
const ProductVariationModel = require(path.resolve('src/model/ProductVariationModel'));
const repository = require(path.resolve('src/repository'));
const { translate_ggl: translate } = require(path.resolve('src/lib/TranslateService'));
const cache = new NodeCache();

const CONFIG_KEY = 'TranslateProductVariation';

const activity = {
  start: async () => {
    const config = cache.get(CONFIG_KEY);
    const { position: skip, limit } = config;
    const where = { $or: [
      { translation: { $exists: false } },
      { "translation.displayName": { $exists: false } },
      { "translation.values": { $exists: false } },
    ] };

    const total = await ProductVariationModel.countDocuments(where);
    if (!total) {
      logger.info(`[TranslateProductVariation] All has been translated`);
      cache.set(CONFIG_KEY, { ...config, running: false });
      return;
    }

    // mark the robot as running and start.
    cache.set(CONFIG_KEY, { ...config, running: true });
    const variations = await ProductVariationModel.find(where, null, { limit, skip });

    logger.info(`[TranslateProductVariation][${skip}-${skip + variations.length}/${total}] Start!`);

    const batch = 20;
    const iterN = Math.ceil(variations.length / batch);
    for (let i = 0; i < iterN; i ++) {
      await Promise.all(variations.slice(i * batch, (i + 1) * batch).map(variation => activity.translateVariation(variation, repository)));
      logger.info(`[translateProductVariation][<${i * batch}-${(i + 1) * batch}>/${variations.length}/${total}] done!`);
    }

    cache.set(CONFIG_KEY, { ...config, running: true });
    activity.start();
  },
  translateVariation: async (variation, repository) => {
    const tDisplayName = await translate(variation.displayName);
    return Promise.all(variation.values.map(value => translate(value)))
      .then(tValues => {
        variation.translation = {
          displayName: tDisplayName,
          values: tValues,
        };
        return variation.save();
      })
      .catch((error) => console.log('[Error]', error));
  },
};

module.exports = class TranslateProductVariationRobot extends BaseRobot {
  constructor() {
    super(60 * 60 * 1000);
    cache.set(CONFIG_KEY, { position: 0, limit: 50, running: false });
  }

  execute() {
    const config = cache.get(CONFIG_KEY);
    if (config.running) return;

    return Promise.all([
      activity.start(),
    ])
      .then(() => {
        super.execute();
        logger.info(`[Robot][TranslateProductVariationRobot] was executed!`);
      });
  }
};
