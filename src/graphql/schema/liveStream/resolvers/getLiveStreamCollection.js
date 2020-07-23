const path = require('path');
const ProductService = require(path.resolve('src/lib/ProductService'));

module.exports = async (_, { filter, page, sort }, { user, dataSources: { repository } }) => {
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };

  if (user) {
    filter.blackList = user.blackList;
  }

  if (filter.productFilter && Object.keys(filter.productFilter).length) {
    const productFilter = await ProductService.composeProductFilter(filter.productFilter, user);
    const products = await repository.product.get({ filter: productFilter, page: {}, sort: { feature: "CREATED_AT", type: "DESC" } });
    filter.products = products.map(product => product._id);
  }

  return Promise.all([
    repository.liveStream.get({ filter, page, sort }),
    repository.liveStream.getTotal(filter),
  ])
    .then(([collection, total]) => ({
      collection,
      pager: { ...pager, total },
    }));
};
