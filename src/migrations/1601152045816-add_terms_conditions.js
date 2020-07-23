const path = require('path');

require(path.resolve('config/mongoMigrateConnection'));

const logger = require(path.resolve('config/logger'));
const TermsConditionModel = require('../model/TermsConditionModel');
const en_terms = require('./sources/terms/en_terms.json');
const in_terms = require('./sources/terms/in_terms.json');
const ja_terms = require('./sources/terms/ja_terms.json');
const zh_terms = require('./sources/terms/zh_terms.json');

/**
 * Make any changes you need to make to the database here
 */
async function up () {
  return true;
  // Write migration here
  let newTerms = []
  en_terms.terms_conditions.map((term) =>{
    newTerms.push({
      prefix: '/terms_conditions/en/',
      englishTitle: term.english_title,
      title: term.title,
      html: term.html,
      language: 'EN'
    })
  })

  in_terms.terms_conditions.map((term) =>{
    newTerms.push({
      prefix: '/terms_conditions/in/',
      englishTitle: term.english_title,
      title: term.title,
      html: term.html,
      language: 'ID'
    })
  })
  
  ja_terms.terms_conditions.map((term) =>{
    newTerms.push({
      prefix: '/terms_conditions/ja/',
      englishTitle: term.english_title,
      title: term.title,
      html: term.html,
      language: 'JA'
    })
  })

  zh_terms.terms_conditions.map((term) =>{
    newTerms.push({
      prefix: '/terms_conditions/zh/',
      englishTitle: term.english_title,
      title: term.title,
      html: term.html,
      language: 'ZH'
    })
  })

  return TermsConditionModel.insertMany(newTerms)
    .then((docs) => {
      logger.info(`[MIGRATE] added ${docs.length} Terms & Conditions documents to Mongo!`);
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
  return TermsConditionModel.remove({ name: /.*/ })
  .then((res) => {
    logger.info(`[MIGRATE] removed ${res.deletedCount} Terms & Conditions documents from Mongo!`);
  })
  .catch((error) => {
    logger.error(error.message);
    throw error;
  }); 
}

module.exports = { up, down };
