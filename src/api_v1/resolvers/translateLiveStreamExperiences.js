const path = require('path');

const logger = require(path.resolve('config/logger'));
const { LanguageList } = require(path.resolve('src/lib/Enums'));
const LiveStreamExperienceModel = require(path.resolve('src/model/LiveStreamExperienceModel'));
const { translate_ggl: translate } = require(path.resolve('src/lib/TranslateService'));

const activity = {
  translate: async () => {
    const query = { $or: [
      { "translations": { $exists: false } },
      { "translations.name": { $exists: false } },
      { "translations.name.es": { $exists: false } },
    ] };
  
    const total = await LiveStreamExperienceModel.countDocuments(query); console.log('[Translation][LiveStreamExperience][Total]', total);
  
    if (total === 0) return { status: true, message: 'Already translated!' };
  
    const batch = 100;
    const nIter = Math.ceil(total / batch);
  
    for (let i = 0; i < nIter; i++) {
      const categories = await LiveStreamExperienceModel.find(query, null, { limit: batch, skip: 0 });
      logger.info(`[Translation][LiveStreamExperience] [${i * batch} - ${(i + 1) * batch}] Start! [${categories.length}]`);
      await activity.processBatch(categories);
      logger.info(`[Translation][LiveStreamExperience] [${i * batch} - ${(i + 1) * batch}] Done!`);
    }
  
    logger.info(`[Translation][LiveStreamExperience] All Done!`);
    return { status: true, message: "All Done!" };
  },
  processBatch: async (categories) => {
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const _names = {};
      const _descriptions = {};
      const languageList = LanguageList.toList();
      await Promise.all(languageList.map(async language => {
        const _name = await translate(language.toLowerCase(), category.name);
        const _description = await translate(language.toLowerCase(), category.description);
        _names[language.toLowerCase()] = _name;
        _descriptions[language.toLowerCase()] = _description;
      }));
      category.translations = {
        name: _names,
        description: _descriptions,
      };
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
