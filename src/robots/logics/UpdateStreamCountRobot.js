/* eslint-disable no-param-reassign */
const path = require('path');
const BaseRobot = require('./BaseRobot');
const NodeCache = require('node-cache');
const cache = new NodeCache();

const logger = require(path.resolve('config/logger'));
const StreamService = require(path.resolve('src/lib/StreamService'));
const LiveStreamCategoryModel = require(path.resolve('src/model/LiveStreamCategoryModel'));
const LiveStreamExperienceModel = require(path.resolve('src/model/LiveStreamExperienceModel'));

const CATEGORY_CONFIG = 'UpdateStreamCountRobot.Category';
const EXPERIENCE_CONFIG = 'UpdateStreamCountRobot.Experience';

const activity = {
  updateCategory: async () => {
    const config = cache.get(CATEGORY_CONFIG);
    const { position: skip, limit } = config;
    return Promise.all([
      LiveStreamCategoryModel.find({}, null, { limit, skip, sort: { createdAt: 1 } }),
      LiveStreamCategoryModel.countDocuments({}),
    ])
      .then(async ([categories, total]) => {
        await Promise.all(categories.map(category => StreamService.updateStreamCountOfCategory(category._id)));
        config.position = skip + categories.length < total ? skip + limit : 0;
        cache.set(CATEGORY_CONFIG, config);
        // logger.info(`[UpdateStreamCountRobot][Category][${skip}-${skip + categories.length}] was executed!`);
      })
  },
  updateExperience: async () => {
    const config = cache.get(EXPERIENCE_CONFIG);
    const { position: skip, limit } = config;
    return Promise.all([
      LiveStreamExperienceModel.find({}, null, { limit, skip, sort: { createdAt: 1 } }),
      LiveStreamExperienceModel.countDocuments({}),
    ])
      .then(async ([experiences, total]) => {
        await Promise.all(experiences.map(experience => StreamService.updateStreamCountForExperience(experience._id)));
        config.position = skip + experiences.length < total ? skip + limit : 0;
        cache.set(EXPERIENCE_CONFIG, config);
        // logger.info(`[UpdateStreamCountRobot][Experience][${skip}-${skip + experiences.length}] was executed!`);
      })
  },
}

module.exports = class UpdateStreamCountRobot extends BaseRobot {
  constructor() {
    super(180 * 60 * 1201);
    cache.set(CATEGORY_CONFIG, { position: 0, limit: 50 });
    cache.set(EXPERIENCE_CONFIG, { position: 0, limit: 50 });
  }

  execute() {
    return Promise.all([
      activity.updateCategory(),
      activity.updateExperience(),
    ])
      .then(() => {
        super.execute();
        // logger.info(`[UpdateStreamCountRobot] was executed!`);
      });
  }
};