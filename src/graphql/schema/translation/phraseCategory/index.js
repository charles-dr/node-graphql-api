const { gql } = require('apollo-server');
// const updatephraseCategoryAssets = require('./resolvers/updatephraseCategoryAssets');
const addPhraseCategory = require('./resolvers/addPhraseCategory');
const updatePhraseCategory = require('./resolvers/updatePhraseCategory');

const schema = gql`
  type PhraseCategory {
    id: ID!
    name: String!
    level: Int!
    parent: PhraseCategory
    parents: [PhraseCategory]!
    hasChildren: Boolean!
  }

  input PhraseCategoryInput {
    name: String!
    parent: String
  }

  type PhraseCategoryCollection {
    collection: [PhraseCategory]!
    pager: Pager
  }

  extend type Query {
    searchPhraseCategory(query: String!, page: PageInput = {}): PhraseCategoryCollection!
    phraseCategories(parent: ID, includeAll: Boolean = false): [PhraseCategory]!
    phraseCategory(id: ID!): PhraseCategory
  }

  extend type Mutation {
    """
      Allows: authorized user
    """
    #   updatephraseCategoryAssets(fileName:String!): [Asset] @auth(requires: USER)
    addPhraseCategory(data: PhraseCategoryInput!): PhraseCategory!
    updatePhraseCategory(id: ID!, name: String, parent: String): PhraseCategory!
    removeAllPhraseCategories: Boolean! @auth(requires: USER)
  }
`;

module.exports.typeDefs = [schema];


const emptyResult = {
  collection: [],
  pager: {
    total: 0,
  },
};

function composeTypeResult(page) {
  return ([collection, total]) => ({
    ...emptyResult,
    collection: collection || [],
    pager: {
      ...page, total,
    },
  });
}

module.exports.resolvers = {
  Query: {
    searchPhraseCategory: async (_, { query, page }, { dataSources: { repository } }) => {
      if (query.length < 2) {
        return composeTypeResult(page)([null, 0]);
      }

      return Promise.all([
        repository.phraseCategory.searchByName(query, page),
        repository.phraseCategory.getCountBySearch(query),
      ])
        .then(composeTypeResult(page));
    },
    phraseCategories: async (_, { parent = null, includeAll = false }, { dataSources: { repository } }) => (
      !includeAll ? repository.phraseCategory.getByParent(parent) : repository.phraseCategory.allUnderParent(parent)
    ),
    phraseCategory: async (_, { id }, { dataSources: { repository } }) => (
      repository.phraseCategory.getById(id)
    ),
  },
  Mutation: {
    // updatephraseCategoryAssets
    addPhraseCategory,
    updatePhraseCategory,
    removeAllPhraseCategories: async (_, { data }, { dataSources: { repository }, user }) => {
      return repository.phraseCategory.deleteAll()
        .then(() => { return true })
        .catch(error => false);
    }
  },
  PhraseCategory: {
    parent: async (phraseCategory, _, { dataSources: { repository } }) => {
      if (!phraseCategory.parent) {
        return null;
      }
      return repository.phraseCategory.getById(phraseCategory.parent);
    },
    parents: async ({ parents }, _, { dataSources: { repository } }) => {
      if (parents.length === 0) {
        return [];
      }
      return repository.phraseCategory.findByIds(parents);
    },
  },
};
