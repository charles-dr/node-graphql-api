const { merge } = require('lodash');

const { typeDefs: issueCategoryTypeDefs, resolvers: issueCategoryResolvers } = require('./issueCategory');
const { typeDefs: issueTypeDefs, resolvers: issueResolvers } = require('./issue');


const typeDefs = [].concat(
  issueCategoryTypeDefs,
  issueTypeDefs,
);

const resolvers = merge(
  issueCategoryResolvers,
  issueResolvers,
);

module.exports = {
  typeDefs,
  resolvers,
};
