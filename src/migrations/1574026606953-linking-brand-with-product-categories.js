const path = require('path');
const Promise = require('bluebird');

require(path.resolve('config/mongoMigrateConnection'));

const logger = require(path.resolve('config/logger'));
const brandModel = require('../model/BrandModel');

const dirtyBrands = require('./sources/brands-source.json');
const productCategories = require('./sources/product-categories');

async function up() {
  const brands = [];
  const duplicates = [];

  dirtyBrands.forEach((brand) => {
    if (!brands.some((dBrand) => dBrand.name.toLowerCase() === brand.name.toLowerCase())) {
      brands.push(brand);
    } else {
      duplicates.push(brand);
    }
  });

  logger.warn(`Found ${dirtyBrands.length - brands.length} duplicates "${duplicates.map((item) => item.name).join(', ')}"`);

  return Promise.map(
    brands,
    (brand) => {
      const categoryIds = productCategories
        .filter((cat) => brand.productCategories.includes(cat.category))
        .map((cat) => cat._id);
      return brandModel.updateOne({ _id: brand._id }, { productCategories: categoryIds });
    },
    { concurrency: 50 },
  );
}

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
async function down() {
  // Write migration here
}

module.exports = { up, down };
