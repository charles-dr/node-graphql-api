/**
 * Make any changes you need to make to the database here
 */
const path = require('path');

require(path.resolve('config/mongoMigrateConnection'));
const logger = require(path.resolve('config/logger'));
const BrandModel = require('../model/BrandModel');

const brandIds = [
  "ff54a59c-67ae-4ee3-9c23-ccc8ebe6b19b", "a73d982c-ce2c-4285-a546-0356329badce", "79b59783-844e-43f3-8f61-15b24240fcb9",
  "320198b8-bd51-4241-8e2d-e3af37751f93", "9adffd53-f370-41c1-b7af-cb0dd126a2aa", "00f147a4-2729-4a83-a166-ef836cfdc33b",
  "9f345918-90b0-4c88-9c47-ef3a434a01f9", "dcaf199b-4257-475b-8480-dcdb3dfce326", "35d25739-c268-43aa-a3be-d0cb839a43ae",
  "72907905-1e0e-4af2-b618-93e971618994", "2bcd9b6f-b8ad-4b2b-b2b2-d957464d213c", "2dac8115-6d4b-47af-862b-4546dde6c4db",
  "8bb26d4a-6591-4e5e-baa9-473579046aba", "c7723f15-3eee-40b5-8f9b-5b4947389bb4", "d62fddbb-20af-4ddf-8d38-7de54c7f33b4",
  "7491330a-4c83-42ae-83a0-9fc0460a34cb", "a7d9d37a-0dcc-4644-9ed4-fb88fe8f15bc", "d8a56b9f-d373-4d75-8c2d-063c9e04dcbc",
  "ce4a10c8-8d92-4f1a-b552-34ca5538b963", "70b883ae-d255-4db0-b113-300a729faae1", "20c6dd1a-1c18-4b5d-bae9-574b88ceccf0",
  "770038e2-7ac3-4e12-a194-df2bd7b252a7", "ae2e8121-c48f-44c5-bf2e-f4da10389dbd", "dd34e471-f041-4033-9cfe-153d8f84a0f3",
];

async function up () {
  // Write migration here
  return BrandModel.updateMany({}, { order: 100 })
    .then(() => BrandModel.update({ _id: {$in: brandIds} }, { order: 0 }))
    .then(() => {
      logger.info(`[MIGRATE] updated order of Brand documents to Mongo!`);
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
