const path = require('path');
const { slugify } = require('transliteration');

require(path.resolve('config/mongoMigrateConnection'));
const logger = require(path.resolve('config/logger'));
const BrandModel = require('../model/BrandModel');

const processBatch = async ({ skip, limit }) => {
  return BrandModel.find({}, null, { sort: { name: 1 }, skip, limit })
    .then((brands) => Promise.all(brands.map(async (brand) => {
      brand.slug = slugify(brand.name);
      const others = await BrandModel.find({ name: { $regex: `^${brand.name}$`, $options: 'i' } })
        .then((items) => items)
        .catch((error) => []);
      if (others.length > 1) {
        brand.slug += '-' + Math.floor(Math.random() * 100).toString();
      }
      return brand.save();
    })));
}

/**
 * Make any changes you need to make to the database here
 */
async function up () {
  const batch = 100;
  // Write migration here
  return BrandModel.countDocuments({})
    .then(async (total) => {
      const nBatch = Math.ceil(total / batch);
      for (let i = 0; i < nBatch; i++) {
        await processBatch({ skip: i * batch, limit: batch });
      }
      return total;
    })
    .then((total) => {
      logger.info(`[MIGRATE] updated ${total} Brand documents to Mongo!`);
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
