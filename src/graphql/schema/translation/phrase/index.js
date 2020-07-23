const path = require('path');
const { gql } = require('apollo-server');

const addPhrase = require('./resolvers/addPhrase');
const deletePhrase = require('./resolvers/deletePhrase');
const phrases = require('./resolvers/phrases');
const updatePhrase = require('./resolvers/updatePhase');

const schema = gql`
  type Phrase {
    id: ID!
    slug: String!
    category: PhraseCategory
    translations: [PhraseItem]
  }

  type PhraseItem {
    lang: LanguageDetails!
    text: String!
  }

  input PhraseInput {
    slug: String!
    category: String!
    translations: [PhraseItemInput]
  }

  input PhraseItemInput {
    lang: LanguageList!
    text: String!
  }

  type PhraseCollection {
    collection: [Phrase]!
    pager: Pager
  }    

  enum PhraseSortFeature {
    ALPHABET
    CREATED_AT
  }

  input PhraseSortInput {
    feature: PhraseSortFeature! = ALPHABET
    type: SortTypeEnum! = ASC
  }

  input PhraseFilterInput {
    searchQuery: String
    categories: [ID!]
    lang: LanguageList
  }

  extend type Query {
    phrase(id: ID!): Phrase!
    phrases(
      filter: PhraseFilterInput
      sort: PhraseSortInput = {},
      page: PageInput = {}
    ): PhraseCollection!
  }

  extend type Mutation {
    addPhrase(data: PhraseInput!): Phrase!
    deletePhrase(id: ID!): Boolean!
    updatePhrase(id: ID!, translations: [PhraseItemInput]!): Phrase!
    removeAllPhrases: Boolean! @auth(requires: USER)
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    phrase: async (_, { id }, { dataSources: { repository }, user }) => {
      return repository.phrase.getById(id);
    },
    phrases
  },
  Mutation: {
    addPhrase,
    deletePhrase,
    updatePhrase,
    removeAllPhrases: async (_, { data }, { dataSources: { repository }, user }) => {
      return repository.phrase.deleteAll()
        .then(() => { return true })
        .catch(error => false);
    }
  },
  Phrase: {
    category: async (phrase, _, { dataSources: { repository } }) => {
      if (!phrase.category) return null;
      return repository.phraseCategory.getById(phrase.category);
    }
  },
  PhraseItem: {
    lang: async ({ lang }, _, { dataSources: { repository } }) => {
      return repository.language.getById(lang);
    }
  }
}
