const { gql } = require('apollo-server');
const uuid = require('uuid/v4');

const updateBrandCategory = require('./resolvers/updateBrandCategory');

const schema = gql`
    type BrandCategory {
      id: ID!
      name(language: LanguageList = EN): String!
      isRecommended: Boolean!
      hashtags: [String]
    }

    input BrandCategoryInput{
      name: String!
      isRecommended: Boolean
      hashtags: [String]
    }

    input BrandCategoryUpdateInput{
      name: String
      isRecommended: Boolean
    }

    type BrandCategoryCollection {
      collection: [BrandCategory]!
      pager: Pager
    }

    input BrandCategoryFilterInput {
      query: String
      isRecommended: Boolean
    }

    extend type Query {
      brandCategories(filter: BrandCategoryFilterInput, page: PageInput = {}): BrandCategoryCollection!
      brandCategory(id: ID!): BrandCategory
    }

    extend type Mutation {
      addBrandCategory(data:BrandCategoryInput!): BrandCategory! @auth(requires: USER)
      updateBrandCategory(id: ID!, data: BrandCategoryUpdateInput!): BrandCategory! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    brandCategories: async (_, { filter, page }, { dataSources: { repository } }) => {
      const result = {
        collection: [],
        pager: {
          ...page,
          total: 0,
        },
      };

      return Promise.all([
        repository.brandCategory.search(filter, page),
        repository.brandCategory.getCountBySearch(filter),
      ])
        .then(([collection, total]) => {
          result.collection = collection || [];
          result.pager.total = total;
          return result;
        });
    },
    brandCategory: async (_, { id }, { dataSources: { repository } }) => repository.brandCategory.getById(id),
  },
  Mutation: {
    addBrandCategory: async (_, args, { dataSources: { repository } }) => {
      return repository.brandCategory.create({
        _id: uuid(),
        name: args.data.name,
        isRecommended: !!args.data.isRecommended,
        hashtags: args.data.hashtags || [],
      })
    },
    updateBrandCategory,
  },
  BrandCategory: {
    name: ({ name, translations }, { language }, { dataSources: { repository } }) => (translations && translations[language.toLowerCase()]) ? translations[language.toLowerCase()] : name,
  },
};
