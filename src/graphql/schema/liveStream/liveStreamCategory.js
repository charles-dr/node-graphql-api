const path = require('path');
const { gql } = require('apollo-server');

const { cdn } = require(path.resolve('config'));

const schema = gql`
  type LiveStreamCategory {
    id: ID!
    name(language: LanguageList = EN): String!
    image: String
    hashtags: [String]
    slug: String
  }

  extend type Query {
    liveStreamCategories(hasStream: Boolean = true): [LiveStreamCategory]!
    liveStreamCategory(id: ID!): LiveStreamCategory
    liveStreamCategoryBySlug(slug: String!): LiveStreamCategory
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    liveStreamCategory(_, { id }, { dataSources: { repository } }) {
      return repository.liveStreamCategory.getById(id);
    },
    liveStreamCategories(_, { hasStream }, { dataSources: { repository } }) {
      const query = {};
      if (typeof hasStream === 'boolean' && hasStream === true) {
        query.$or = [{"nStreams.streaming": {$gt: 0}}, {"nStreams.finished": {$gt: 0}}];
      } else if (typeof hasStream === 'boolean' && hasStream === false) {
        query.$and = [{"nStreams.streaming": {$eq: 0}}, {"nStreams.finished": {$eq: 0}}];
      }
      return repository.liveStreamCategory.getAll(query);
    },
    liveStreamCategoryBySlug(_, { slug }, {dataSources: { repository } }) {
      return repository.liveStreamCategory.getBySlug(slug);
    },
  },
  LiveStreamCategory: {
    name: ({ translations, name }, { language }, { dataSources: { repository } }) => (translations && translations[language.toLowerCase()]) ? translations[language.toLowerCase()] : name,
    image: async (liveStreamCategory) => `${cdn.appAssets}${liveStreamCategory.imagePath}`,
  },
};
