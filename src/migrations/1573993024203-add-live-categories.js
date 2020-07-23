const path = require('path');

require(path.resolve('config/mongoMigrateConnection'));

const logger = require(path.resolve('config/logger'));
const liveStreamCategoryModel = require('../model/LiveStreamCategoryModel');

const liveStreamCategories = [
  {
    _id: 'd713ee93-60b7-479f-ae39-b4e554495a29', order: 1, name: 'Women Fashion', imagePath: '/categories/women-fashion.jpg',
  },
  {
    _id: '48b1990c-90e3-494c-89f3-e0a2edc92522', order: 2, name: 'Men Fashion', imagePath: '/categories/men-fashion.jpg',
  },
  {
    _id: '0e7e17af-d955-49df-b179-e2eafe552054', order: 3, name: 'Kids Fashion', imagePath: '/categories/kids-fashion.jpg',
  },
  {
    _id: '0afb0136-70b2-48fd-9d6e-0157ba5788ff', order: 4, name: 'Footwear', imagePath: '/categories/footwear.jpg',
  },
  {
    _id: '906d886f-6183-4071-809c-f56585367404', order: 5, name: 'Consumer Electronics', imagePath: '/categories/consumer-electronics.jpg',
  },
  {
    _id: '4a72e210-599b-449d-856b-1c471a507869', order: 6, name: 'Health & Beauty', imagePath: '/categories/health-and-beauty.jpg',
  },
  {
    _id: 'b22346b6-87ac-4c3b-84af-8585bd519985', order: 7, name: 'Home Goods', imagePath: '/categories/homegoods.jpg',
  },
  {
    _id: '77be0706-1c4f-45d1-a8cb-0faf8c7f5280', order: 8, name: 'Media & Entertainment', imagePath: '/categories/media-and-entertainment.jpg',
  },
  {
    _id: 'c9d21db5-0738-4efa-ade6-a120ff21af1b', order: 9, name: 'Tickets & Reservations', imagePath: '/categories/tickets-and-reservation.jpg',
  },
  {
    _id: '72c8ad36-6204-4f11-b51b-487c93e1530f', order: 10, name: 'Sporting Goods', imagePath: '/categories/sport-goods.jpg',
  },
  {
    _id: '630e6ad9-942f-4911-9629-0d6cca87513a', order: 11, name: 'Automotive', imagePath: '/categories/automobiles.jpg',
  },
  {
    _id: 'e54e53cc-6568-46b4-a481-98e98cf60b3b', order: 12, name: 'Real Estate', imagePath: '/categories/real-estate.jpg',
  },
  {
    _id: 'e516cb92-7a9b-4618-93ef-ad8b535c7b60', order: 13, name: 'Toys & Collectibles', imagePath: '/categories/toys-and-collectibles.jpg',
  },
  {
    _id: '1b4c86c2-0896-4513-90dc-c944913bf016', order: 14, name: 'Adult-Only', imagePath: '/categories/adult-only.jpg',
  },
];

async function up() {
  return liveStreamCategoryModel.insertMany(liveStreamCategories)
    .then((docs) => {
      logger.info(`[MIGRATE] added ${docs.length} LiveStream Category documents to Mongo!`);
    })
    .catch((error) => {
      logger.error(error.message);
      throw error;
    });
}

async function down() {
  return liveStreamCategoryModel.remove({ name: /.*/ })
    .then((res) => {
      logger.info(`[MIGRATE] removed ${res.deletedCount}  LiveStream Category documents from Mongo!`);
    })
    .catch((error) => {
      logger.error(error.message);
      throw error;
    });
}

module.exports = { up, down };
