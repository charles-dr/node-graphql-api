const path = require('path');
const { gql } = require('apollo-server');

const setVocabularyBase = require('./resolvers/setVocabularyBase');
const translateVocabulary = require('./resolvers/translateVocabulary')

const schema = gql`
  type Vocabulary {
    id: ID!
    key: String!
    translations: JSON
  }

  type ObjectItem {
    key: String!
    value: String!
  }

  input VocabularyInput {
    slug: String!
    category: String!
    translations: [PhraseItemInput]
  }

  input ObjectItemInput {
    key: String!
    value: String!
  }

  extend type Query {
    vocabulary(id: ID!): Vocabulary!
    vocabularyAsJson(lang: LanguageList): JSON!
  }

  extend type Mutation {
    """
      Update the collection when key list changes.
      'lang' is the language of the template values. Maybe the default language.
    """
    setVocabularyBase(lang: LanguageList, file: Upload!): [Vocabulary] @auth(requires: ADMIN)
    translateVocabulary(lang: LanguageList): [Vocabulary]

  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    vocabulary: async (_, { id }, { dataSources: { repository }, user }) => {
      return repository.vocabulary.getById(id);
    },
    vocabularyAsJson: (_, { lang }, { dataSources: { repository }, user }) => repository.vocabulary.getAll().then((vocabs) => {
      const obj = {};
      vocabs.forEach((vocab) => {
        obj[vocab.key] = vocab.translations[lang] || vocab.translations['EN'];
      })
      return obj;
    }),
  },
  Mutation: {
    setVocabularyBase,
    translateVocabulary,
  },
}
