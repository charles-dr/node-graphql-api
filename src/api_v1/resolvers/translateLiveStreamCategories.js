const path = require('path');

const logger = require(path.resolve('config/logger'));
const { LanguageList } = require(path.resolve('src/lib/Enums'));
const LiveStreamCategoryModel = require(path.resolve('src/model/LiveStreamCategoryModel'));
const { translate_ggl: translate } = require(path.resolve('src/lib/TranslateService'));

const activity = {
  translate: async () => {
    const query = { $or: [
      { "translations": { $exists: false } },
      { "translations.es": { $exists: false } },
    ] };
  
    const total = await LiveStreamCategoryModel.countDocuments(query); console.log('[Translation][LiveStreamCategory][Total]', total);
  
    if (total === 0) return { status: true, message: 'Already translated!' };
  
    const batch = 100;
    const nIter = Math.ceil(total / batch);
  
    for (let i = 0; i < nIter; i++) {
      const categories = await LiveStreamCategoryModel.find(query, null, { limit: batch, skip: 0 });
      logger.info(`[Translation][LiveStreamCategory] [${i * batch} - ${(i + 1) * batch}] Start! [${categories.length}]`);
      await activity.processBatch(categories);
      logger.info(`[Translation][LiveStreamCategory] [${i * batch} - ${(i + 1) * batch}] Done!`);
    }
  
    logger.info(`[Translation][LiveStreamCategory] All Done!`);
    return { status: true, message: "All Done!" };
  },
  processBatch: async (categories) => {
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const _translations = {};
      const languageList = LanguageList.toList();
      await Promise.all(languageList.map(async language => {
        const _name = await translate(language.toLowerCase(), category.name);
        _translations[language.toLowerCase()] = _name;
      }));
      category.translations = _translations;
      await category.save();
      await activity.sleep(300);
    }
  },
  sleep: async (ms) => new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true);
    }, ms);
  }),
};

module.exports = async (req, res) => {
  console.log('[Translate][Brands]')
  return activity.translate()
    .then(resp => res.json(resp))
    .catch(error => res.json({ status: false, message: error.message }));
}
