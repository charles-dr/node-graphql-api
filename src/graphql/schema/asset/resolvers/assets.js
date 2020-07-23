const path = require('path');
const { Validator } = require('node-input-validator');
const { ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

module.exports = async (_, { filter = {}, sort = { feature: 'CREATED_AT', type: 'ASC' }, page = { limit: 0, skip: 0 } }, { dataSources: { repository }, user }) => {
  console.log('[sort]', sort)
  const query = { owner: user._id }
  if (filter.type) query.type = filter.type;
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };

  return Promise.all([
    repository.asset.get(query, sort, page),
    repository.asset.getTotal(query),
  ])
    .then(([collection, total]) => {
      return {
        collection,
        pager: { ...pager, total },
      };
    })
}