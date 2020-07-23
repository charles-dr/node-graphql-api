const path = require('path');
const BrandModel = require(path.resolve('src/model/BrandModel'));

module.exports = (req, res) => {
  return BrandModel.updateMany(
    { productCategories: null },
    { productCategories: [] }
  )
    .then(({ nModified }) => {
      console.log(`[Fix][Brand][ProductCategories] fixed ${nModified} brands.`);
      return res.json({
        status: true,
        message: 'success',
        count: nModified,
      });
    })
    .catch(error => res.json({ status: false, message: error.message }));
}
