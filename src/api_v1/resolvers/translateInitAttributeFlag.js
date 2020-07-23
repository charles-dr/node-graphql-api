const path = require('path');
const ProductAttributesModel = require(path.resolve('src/model/ProductAttributesModel'));

module.exports = async (req, res) => {
  return ProductAttributesModel.updateMany({}, { translated: 0 })
    .then(() => res.json({ status: true }))
    .catch(error => res.json({ status: false, message: error.message }));
}
