const { merge } = require('lodash');

const { typeDefs: transactionTypeDefs, resolvers: transactionResolvers } = require('./transaction');
const { typeDefs: methodTypeDefs, resolvers: methodResolvers } = require('./method');

const typeDefs = [].concat(
  transactionTypeDefs,
  methodTypeDefs,
);

const resolvers = merge(
  transactionResolvers,
  methodResolvers,
);

module.exports = {
  typeDefs,
  resolvers,
};
