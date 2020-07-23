const path = require('path');
const csv = require('csv-parser');
const fs = require('fs');
require(path.resolve('config/mongoMigrateConnection'));
const logger = require(path.resolve('config/logger'));
const ProductCategoryModel = require('../model/ProductCategoryModel');

const csvPath = path.resolve('src/migrations/sources/CategoriesMatching-SiblingCategories-Shoes.csv');

async function parseCSVContent() {
  const results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results));
  })
}


/**
 * Make any changes you need to make to the database here
 */
async function up () {
  // Write migration here
  return parseCSVContent()
    .then(rows => {
      console.log('[Parsed]', rows.length);
      return rows;
    })
    .then(rows => Promise.all(rows.map(async row => {
      const category1 = await ProductCategoryModel.findOne({ _id: row._id });
      const category2 = await ProductCategoryModel.findOne({ _id: row.sibling_id_category });
      if (category1) {
        category1.siblings = [row.sibling_id_category]; await category1.save();
      }
      if (category2) {
        category2.siblings = [row._id]; await category2.save();
      }
      return true;
    })))
    .then((rows) => {
      logger.info(`[MIGRATE] updated ${rows.length} Product Category documents to Mongo!`);
    })
    .catch((error) => {
      console.log('[Error]', error)
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
