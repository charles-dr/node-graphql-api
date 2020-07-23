const path = require('path');

const logger = require(path.resolve('config/logger'));
const ProductModel = require(path.resolve('src/model/ProductModel'));

module.exports = (req, res) => {
  return ProductModel.updateMany({ isDeleted: false }, { hashtags: [] })
    .then(({ nModified }) => res.json({
      status: true,
      message: 'success',
      nRows: nModified,
    }))
    .catch((error) => res.json({
      status: true,
      message: 'failure',
      details: error.message,
    }));
};
