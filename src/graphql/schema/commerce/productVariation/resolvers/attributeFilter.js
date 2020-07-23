const path = require('path');
const ProductService = require(path.resolve('src/lib/ProductService'));


module.exports = async (_, { data }, { dataSources: { repository } }) => {

  return ProductService.attributeFilter(data);
}
