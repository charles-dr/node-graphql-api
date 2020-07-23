const path = require('path');
const ProductService = require(path.resolve('src/lib/ProductService'));

module.exports = async (_, { keyword }, { dataSources: { repository } }) => {

  return ProductService.findProductVariationsFromKeyword(keyword);
}
