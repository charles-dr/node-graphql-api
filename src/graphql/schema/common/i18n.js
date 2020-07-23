const path = require('path');
const { gql } = require('apollo-server');

const { i18n: { locales } } = require(path.resolve('config'));

const schema = gql`
    enum Locale {
      ${locales.join('\n')}
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {};
