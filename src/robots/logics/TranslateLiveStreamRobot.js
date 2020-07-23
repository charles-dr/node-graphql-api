/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
const path = require('path');
const NodeCache = require('node-cache');
const async = require('async');

const BaseRobot = require('./BaseRobot');

const logger = require(path.resolve('config/logger'));
const LiveStreamModel = require(path.resolve('src/model/LiveStreamModel'));
const repository = require(path.resolve('src/repository'));
const { translate_ggl: translate } = require(path.resolve('src/lib/TranslateService'));
const { LanguageList } = require(path.resolve('src/lib/Enums'));

const cache = new NodeCache();
const CONFIG = 'TranslateLiveStream';

const activity = {
  translate: async () => {
    const config = cache.get(CONFIG);
    if (config.running) return false;
    
    cache.set(CONFIG, { ...config, running: true });
    const { position: skip, limit } = config;

    const where = { translated: 0 };

    const total = await LiveStreamModel.countDocuments(where);
    if (!total) {
      logger.info('[TranslateLiveStream] All have been translated!');
      cache.set(CONFIG, { ...config, running: false });
      return;
    }

    const liveStreams = await LiveStreamModel.find(where, null, { limit, skip, sort: { title: 1 } });

    // mark the bot as running.
    cache.set(CONFIG, { ...config, running: true });
    logger.info(`[TranslateLiveStream][${skip}-${skip + liveStreams.length}/${total}] Start!`);

    const title = {};
    const index = 0;

    logger.info(`[TranslateLiveStreamRobot][${skip}-${skip + liveStreams.length}/${total}] Start!`);

    const batch = 10;
    const iterN = Math.ceil(liveStreams.length / batch);
    for (let i = 0; i < iterN; i++) {
      await activity.processBatch(liveStreams.slice(i * batch, (i + 1) * batch), repository);
      logger.info(`[TranslateLiveStream] [${i * batch}-${(i + 1) * batch}] Done`);
    }

    cache.set(CONFIG, {
      ...config,
      position: 0,
      running: true
    });

    activity.translate();
    logger.info(`[TranslateLiveStreamRobot][${skip}-${skip + liveStreams.length}] Finished!`);
  },
  processBatch: async (liveStreams, repository) => {
    return Promise.all(liveStreams.map(async (liveStream) => {
      const { _id } = liveStream;

      const translatedLiveStream = await repository.liveStreamTranslation.getByLivestream(_id);

      // delete all translation for the liveStream
      // if (translatedLiveStream) {
      //   await repository.liveStreamTranslation.deleteByLiveStream(_id);
      // }
      if (translatedLiveStream) {
        liveStream.translated = liveStream.translated ? liveStream.translated : Date.now();
        return activity.saveLiveStream(liveStream);
      }

      const title = await translate(liveStream.title);
      
      liveStream.translated = Date.now();
      await Promise.all([
        repository.liveStreamTranslation.addNewLivestream({ livestream: _id, title }),
        activity.saveLiveStream(liveStream),
      ]);
    }));
  },
  saveLiveStream: (liveStream) => {
    liveStream.categories = liveStream.categories.filter(it => typeof it === 'string');
    return liveStream.save();
  },
};

module.exports = class TranslateLiveStreamRobot extends BaseRobot {
  constructor() {
    super(7 * 60 * 1009);
    cache.set(CONFIG, { position: 0, limit: 100, running: false });
  }

  execute() {
    return Promise.all([
      activity.translate(),
    ])
      // .then(() => {
      //   super.execute();
      // })
      .then(() => {
        logger.info('[TranslateLiveStreamRobot] Logic was executed');
      });
  }
};
