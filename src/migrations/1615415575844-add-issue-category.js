const path = require('path');
require(path.resolve('config/mongoMigrateConnection'));
const logger = require(path.resolve('config/logger'));
const IssueCategoryModel = require('../model/IssueCategoryModel');
const categories = require('./sources/issue-categories.json');

/**
 * Make any changes you need to make to the database here
 */
async function up () {
  // Write migration here
  return Promise.all(categories.map(category => {
    return IssueCategoryModel.findOne({ _id: category._id })
      .then(categoryById => {
        if (categoryById) {
          categoryById.name = category.name;
          categoryById.notifyEmails = category.notifyEmails;
          return categoryById.save();
        } else {
          const item = new IssueCategoryModel(category);
          return item.save();
        }
      })
  }))
  .then(docs => {
    logger.info(`[MIGRATE] added ${docs.length} Issue Category documents to Mongo!`);
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
}

module.exports = { up, down };
