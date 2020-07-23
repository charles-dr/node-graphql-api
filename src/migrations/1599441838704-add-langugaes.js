const path = require('path');

require(path.resolve('config/mongoMigrateConnection'));

const logger = require(path.resolve('config/logger'));
const languageModel = require('../model/LanguageModel');
const CountryLanguage = require('country-language');
const languages = CountryLanguage.getLanguages();
/**
 * Make any changes you need to make to the database here
 */
async function up () {
  // Write migration here
  const languageList = []
  await languages.forEach(item => {
    const ID = item.iso639_1.toUpperCase();
    // const ID = item.iso639_2en == '' ? item.iso639_3.toUpperCase() : item.iso639_2en.toUpperCase();
    // const ID = item.iso639_3.toUpperCase();

    languageList.push({
      _id: ID.split('-')[0],
      name: item.name[0]
    })
  });
  return languageModel.insertMany(languageList)
    .then((docs) => {
      logger.info(`[MIGRATE] added ${docs.length} Language documents to Mongo!`);
    })
    .catch((error) => {
      logger.error(error.message);
      throw error;
    });
}

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
async function down () {
  // Write migration here
  return languageModel.remove({ name: /.*/ })
  .then((res) => {
    logger.info(`[MIGRATE] removed ${res.deletedCount} Language documents from Mongo!`);
  })
  .catch((error) => {
    logger.error(error.message);
    throw error;
  });
}

module.exports = { up, down };
