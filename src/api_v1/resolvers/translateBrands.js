const path = require('path');

const logger = require(path.resolve('config/logger'));
const { LanguageList } = require(path.resolve('src/lib/Enums'));
const BrandModel = require(path.resolve('src/model/BrandModel'));
const { translate_ggl: translate } = require(path.resolve('src/lib/TranslateService'));

const activity = {
  translate: async () => {
    const query = { $or: [
      { "translations": { $exists: false } },
      { "translations.es": { $exists: false } },
    ] };
  
    const total = await BrandModel.countDocuments(query); console.log('[Total]', total);
  
    if (total === 0) return { status: true, message: 'Already translated!' };
  
    const batch = 100;
    const nIter = Math.ceil(total / batch);
  
    for (let i = 0; i < nIter; i++) {
      const brands = await BrandModel.find(query, null, { limit: batch, skip: 0 });
      logger.info(`[Translation][Brands] [${i * batch} - ${(i + 1) * batch}] Start! [${brands.length}]`);
      await activity.processBatch(brands);
      logger.info(`[Translation][Brands] [${i * batch} - ${(i + 1) * batch}] Done!`);
    }
  
    logger.info(`[Translation][Brands] All Done!`);
    return { status: true, message: "All Done!" };
  },
  processBatch: async (brands) => {
    for (let i = 0; i < brands.length; i++) {
      const brand = brands[i];
      const _translations = {};
      const languageList = LanguageList.toList();
      await Promise.all(languageList.map(async language => {
        const _name = await translate(language.toLowerCase(), brand.name);
        // console.log(`[Transalted] ${brand.name} ${language}`)
        _translations[language.toLowerCase()] = _name;
      }));
      brand.translations = _translations;
      await brand.save();
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
