const path = require('path');
const { Validator } = require('node-input-validator');
const { ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

module.exports = async (_, { filter = {}, sort = {}, page }, { dataSources: { repository }, user }) => {
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };

  return Promise.all([
    repository.rating.get(filter, sort, page),
    repository.rating.getTotal(filter),
  ])
    .then(([collection, total]) => {
      return {
        collection,
        pager: { ...pager, total },
      };
    })
}