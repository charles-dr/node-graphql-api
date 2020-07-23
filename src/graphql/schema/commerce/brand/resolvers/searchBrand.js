/* eslint-disable no-param-reassign */
const path = require('path');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

module.exports = async (_, { filter, page, query, hasProduct }, { user, dataSources: { repository } }) => {
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };

  // temp processing of filter parameters.
  if (filter.hasProduct === undefined && hasProduct !== undefined) {
    filter.hasProduct = hasProduct;
  }
  if (filter.searchQuery === undefined && query !== undefined) {
    filter.searchQuery = query;
  }

  return Promise.all([
    repository.brand.get({ filter, page }),
    repository.brand.getTotal(filter),
  ])
    .then(([collection, total]) => ({
      collection,
      pager: { ...pager, total },
    }))
    .catch(error => {
      throw errorHandler.build([error]);
    });
}
