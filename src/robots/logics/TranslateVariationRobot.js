const path = require('path');
const BaseRobot = require('./BaseRobot');
const NodeCache = require('node-cache');
const logger = require(path.resolve('config/logger'));
const ProductAttributesModel = require(path.resolve('src/model/ProductAttributesModel'));
const repository = require(path.resolve('src/repository'));
const { translate_ggl: translate } = require(path.resolve('src/lib/TranslateService'));
const cache = new NodeCache();

const CONFIG_KEY = 'TranslateVariation';

const activity = {
  start: async () => {
    console.log('[ProductAttribute] start');
    const config = cache.get(CONFIG_KEY);
    const { position: skip, limit } = config;
    const where = { translated: 0, "variation.0": { $exists: true } };

    const total = await ProductAttributesModel.countDocuments(where);
    if (!total) {
      logger.info(`[TranslateVariation] All has been translated`);
      cache.set(CONFIG_KEY, { ...config, running: false });
      return;
    }

    // mark the robot as running and start.
    cache.set(CONFIG_KEY, { ...config, running: true });
    const attributes = await ProductAttributesModel.find(where, null, { limit, skip, sort: { price: 1 } });

    logger.info(`[TranslateVariation][${skip}-${skip + attributes.length}/${total}] Start!`);

    const batch = 20;
    const iterN = Math.ceil(attributes.length / batch);
    for (let i = 0; i < iterN; i ++) {
      await Promise.all(attributes.slice(i * batch, (i + 1) * batch).map(attr => activity.translateAttribute(attr, repository)));
      logger.info(`[TranslateAttribute][<${i * batch}-${(i + 1) * batch}>/${attributes.length}/${total}] done!`);
    }

    cache.set(CONFIG_KEY, { ...config, running: true });
    activity.start();
  },
  translateAttribute: (attribute, repository) => {
    return repository.variationTranslation.getByAttribute(attribute.id)
      .then(async translation => {
        if (translation) {
          attribute.translated = attribute.translated ? attribute.translated : Date.now();
          return attribute.save();
        }
        return Promise.all(
          attribute.variation
            .map(variant => translate(variant.value)
              .then(translated => ({ name: variant.name, value: translated })))
        )
          .then(async variations => {
            await repository.variationTranslation.addNewAttribute({ attribute: attribute.id, variations });
            attribute.translated = Date.now();
            attribute.discountPrice = attribute.discountPrice || 0;
            await attribute.save();
          });
      })
  },
};

module.exports = class TranslateVariationRobot extends BaseRobot {
  constructor() {
    super(10 * 60 * 1000);
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
        logger.info(`[Robot][TranslateVariationRobot] was executed!`);
      });
  }
};
