const path = require('path');
const ProductModel = require(path.resolve('src/model/ProductModel'));

module.exports = async (req, res) => {
  return ProductModel.updateMany({ isDeleted: false }, { translated: 0 })
    .then(() => res.json({ status: true }))
    .catch(error => res.json({ status: false, message: error.message }));
}
