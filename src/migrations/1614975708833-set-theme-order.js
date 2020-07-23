const path = require('path');

require(path.resolve('config/mongoMigrateConnection'));

const logger = require(path.resolve('config/logger'));
const ThemeModel = require('../model/ThemeModel');

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
  const orders = {
    "34047667-6c36-4eb3-a7de-fce224b237c7": 1,
    "d6fe7ad7-5d39-4cfe-8bd6-f538d2e30e09": 2,
    "87462bca-d12b-449e-9314-695dc96e6c11": 3,
    "a1286c96-fe6c-416f-b098-fdafe68ea695": 4,
    "6ba38abe-3f3c-467f-b8a7-eaefc493d1fd": 5,
    "55df1e3c-6c87-4718-bb82-aab9552855b3": 6,
    "2f6c4892-1428-4dfb-8dff-40b8b050e346": 7,
    "eee02760-0b73-4646-8461-d68ac12bc023": 8,
    "40310b9e-8593-4d96-af56-a09dad202f9a": 9,
  };

  return ThemeModel.find({})
    .then(themes => Promise.all(themes.map(theme => {
      theme.order = orders[theme._id] || 1000;
      return theme.save();
    })))
    .then((docs) => {
      logger.info(`[MIGRATE] updated ${docs.length} Theme documents to Mongo!`);
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
