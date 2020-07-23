const { gql } = require('apollo-server');
const path = require('path');
// const { LanguageList } = require(path.resolve('src/lib/Enums'));

const schema = gql`
    type TermsItem {
        id: ID!
        prefix: String!,
        englishTitle: String,
        title: String,
        html: String,
        language: LanguageList
    }

    extend type Query {
        termsandcoditions(language: LanguageList!): [TermsItem]!
    }

    extend type Mutation {
      convertToCLanguage3To2: Boolean @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    termsandcoditions(_, args, { dataSources: { repository } }) {
      return repository.termsCondition.getByLanguage(args.language);                                
    },
  },
  Mutation: {
    convertToCLanguage3To2: async (_, __, { dataSources: { repository }}) => {
      const langs = { ENG: "EN", CHI: "ZH", IND: "ID", JPN: "JA" };
      return repository.termsCondition.getAll()
        .then(termsConditions => Promise.all(termsConditions.map(toc => {
          toc.language = langs[toc.language];
          return toc.save();
        })))
        .then(() => true)
        .catch(error => {
          console.log(error);
          return false;
        })
    },
  },
};
