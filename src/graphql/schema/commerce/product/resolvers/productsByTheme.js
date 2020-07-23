const path = require('path');

const ProductService = require(path.resolve('src/lib/ProductService'));

module.exports = async (_, { theme, page, sort }, { dataSources: { repository }, user }) => {
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };

  const { brands, productCategories, hashtags } = await ProductService.analyzeTheme(theme); 
  const filter = { hashtags };
  filter.brands = brands.map(item => item._id);
  filter.productCategories = productCategories.map(item => item._id);

  return Promise.all([
    repository.product.get4Theme({ filter, page, sort }),
    repository.product.getTotal4Theme(filter),
  ])
    .then(([ collection, total ]) => {
      return {
        collection,
        pager: { ...pager, total },
      };
    });  
};
