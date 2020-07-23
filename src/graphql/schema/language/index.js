const { gql } = require('apollo-server');
const path = require('path');
const { LanguageList } = require(path.resolve('src/lib/Enums'));
const CountryLanguage = require('country-language');
const languages = CountryLanguage.getLanguages();

const schema = gql`
  enum LanguageList {
    ${LanguageList.toGQL()}
  }

  type LanguageDetails {
    id: LanguageList!
    name: String!
  }

  extend type Query {
    languages: [LanguageDetails]!
  }

  extend type Mutation {
    deleteAllLanguages: Boolean! @auth(requires: USER)
    insert2LetterFormat: Boolean! @auth(requires: USER)
    insert3LetterFormat: Boolean! @auth(requires: USER)
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    languages(_, args, { dataSources: { repository } }) {
      return repository.language.getAll();
    },
  },
  Mutation: {
    deleteAllLanguages: async (_, { data }, { dataSources: { repository } }) => repository.language.deleteAll()
      .then(() => true)
      .catch((error) => false),
    insert2LetterFormat: async (_, { data }, { dataSources: { repository } }) => {
      const filtered = languages.filter(lang => lang.iso639_1);
      return Promise.all(filtered.map(lang => repository.language.create({
        _id: lang.iso639_1.toUpperCase(),
        name: lang.name[0]
      })))
        .then(() => true)
        .catch(() => false);
    },
    insert3LetterFormat: async (_, { data }, { dataSources: { repository } }) => {
      const filtered = languages.filter(lang => lang.iso639_1);
      return Promise.all(filtered.map(lang => repository.language.create({
        _id: lang.iso639_2en == '' ? lang.iso639_3.toUpperCase() : lang.iso639_2en.toUpperCase(),
        name: lang.name[0]
      })))
        .then(() => true)
        .catch(() => false);
    }
  }
};
