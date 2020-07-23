const { gql } = require('apollo-server');
const translate = require('./resolvers/translate');

const schema = gql`
    input TranslationInput {
        from: LanguageList
        to: LanguageList!
        text: String!
    }

    extend type Mutation {
    #   """
    #       Allows: authorized user
    #   """
        translate(data: TranslationInput!): String!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Mutation: {
    translate,
  },
};
