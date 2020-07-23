const path = require('path');

require(path.resolve('config/mongoMigrateConnection'));

const logger = require(path.resolve('config/logger'));
const csv = require('csv-parser');
const fs = require('fs');
const regionModel = require('../model/RegionModel');
const countries = require('./sources/countries-source.json');

async function up() {
  return new Promise((resolve, reject) => {
    const dirtyRegions = [];
    fs.createReadStream(path.resolve('src/migrations/sources/ne_10m_admin_1_states_provinces.csv'))
      .pipe(csv())
      .on('data', (row) => {
        const region = {
          _id: row['iso_3166_2,C,8'],
          name: row['name_en,C,47'] || row['name,C,44'] || row['gns_name,C,80'] || row['gn_name,C,72'],
          country: row['iso_a2,C,2'],
        };
        if (!region.name) {
          logger.warn(JSON.stringify(row));
        }
        if (
          region._id
          && region.name
          && region.country
          && countries.some((c) => region.country === c._id)
        ) {
          dirtyRegions.push(region);
        }
      })
      .on('end', () => {
        const regions = [];
        const duplicates = [];

        dirtyRegions.forEach((region) => {
          if (!regions.some((dRegion) => dRegion._id.toLowerCase() === region._id.toLowerCase())) {
            regions.push(region);
          } else {
            duplicates.push(region);
          }
        });

        logger.warn(`Found ${dirtyRegions.length - regions.length} duplicates "${duplicates.map((item) => item.name).join(', ')}"`);

        regionModel.insertMany(regions)
          .then((docs) => {
            logger.info(`[MIGRATE] added ${docs.length} Region documents to Mongo!`);
            resolve();
          })
          .catch((error) => {
            logger.error(error.message);
            reject(error);
          });
      });
  });
}

async function down() {
  return regionModel.remove({ name: /.*/ })
    .then((res) => {
      logger.info(`[MIGRATE] removed ${res.deletedCount} Region documents from Mongo!`);
    })
    .catch((error) => {
      logger.error(error.message);
      throw error;
    });
}

module.exports = { up, down };
