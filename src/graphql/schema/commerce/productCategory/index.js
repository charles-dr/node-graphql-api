const { gql } = require('apollo-server');
const updateProductCategoryAssets = require('./resolvers/updateProductCategoryAssets');
const bulkUpdateProductCategory = require('./resolvers/bulkUpdateProductCategory');
const correctProductCategoryHierarchy = require('./resolvers/correctProductCategoryHierarchy');

const schema = gql`
  type ProductCategory {
    id: ID!
    name(language: LanguageList = EN): String!
    level: Int!
    order: Int
    parent: ProductCategory
    parents: [ProductCategory]!
    hasChildren(hasProduct: Boolean = true): Boolean!
    image: Asset
    image4Mobile: Asset
    icon: Asset
    liveStreamCategory: LiveStreamCategory
    hashtags: [String]
    slug: String
    productVariations: [ProductVariation]
  }

  type ProductCategoryCollection {
    collection: [ProductCategory]!
    pager: Pager
  }

  """
    set the map from csv keys to db keys for the fields to be updated.
  """

  type FailedProductCategories{
    row: [Int!]
    errors: [String!]
  }

  type UploadedProductCategories{
    total: Int!
    updated: Int!
    failed: Int!
    failedList: FailedProductCategories!
  }

  type ResizeImageError {
    ids: [ID]
    errors: [String]
  }

  type ImageResized {
    total: Int
    success: Int
    failed: Int
    failedList: ResizeImageError
  }

  extend type Query {
    searchProductCategory(query: String!, page: PageInput = {}, hasProduct: Boolean = true): ProductCategoryCollection!
    productCategories(parent: ID, hasProduct: Boolean = true): [ProductCategory]!
    productCategory(id: ID!): ProductCategory
    productCategoryBySlug(slug: String!): ProductCategory
    fullProductCategories(hasProduct: Boolean = true): [ProductCategory]!
  }

  extend type Mutation {
    """
        Allows: authorized user
    """
    updateProductCategoryAssets(fileName:String!): [Asset] @auth(requires: USER)
    """
      Allows: authorized user
    """
    bulkUpdateProductCategory(file: Upload!): UploadedProductCategories @auth(requires: USER) 
    """
      Allows: authorized admin
    """
    correctProductCategoryHierarchy: Boolean @auth(requires: ADMIN)
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
    searchProductCategory: async (_, { query, page, hasProduct }, { dataSources: { repository } }) => {
      if (query.length < 2) {
        return composeTypeResult(page)([null, 0]);
      }

      return Promise.all([
        repository.productCategory.searchByName(query, page, hasProduct),
        repository.productCategory.getCountBySearch(query, hasProduct),
      ])
        .then(composeTypeResult(page));
    },
    productCategories: async (_, { parent = null, hasProduct }, { dataSources: { repository } }) => (
      repository.productCategory.getByParent(parent, hasProduct)
    ),
    productCategory: async (_, { id }, { dataSources: { repository } }) => (
      repository.productCategory.getById(id)
    ),
    productCategoryBySlug: async (_, { slug }, { dataSources: { repository } }) => (
      repository.productCategory.getBySlug(slug)
    ),
    fullProductCategories: async (_, { hasProduct }, { dataSources: { repository } }) => {
      const query = {};
      if (typeof hasProduct === 'boolean' && hasProduct) query.nProducts = { $gt: 0 };
      else if (typeof hasProduct === 'boolean' && !hasProduct) query.nProducts = { $eq: 0 };
      return repository.productCategory.getAll(query);
    },
  },
  Mutation: {
    updateProductCategoryAssets,
    bulkUpdateProductCategory,
    correctProductCategoryHierarchy,
  },
  ProductCategory: {
    name: ({ name, translations }, { language }) => (translations && translations[language.toLowerCase()]) ? translations[language.toLowerCase()] : name,
    parent: async (productCategory, _, { dataSources: { repository } }) => {
      if (!productCategory.parent) {
        return null;
      }
      return repository.productCategory.getById(productCategory.parent);
    },
    parents: async ({ parents }, _, { dataSources: { repository } }) => {
      if (parents.length === 0) {
        return [];
      }
      return repository.productCategory.findByIds(parents);
    },
    image: async ({ image }, _, { dataSources: { repository } }) => {
      if (!image) {
        return null;
      }
      return repository.asset.getById(image);
    },
    image4Mobile: async ({ image4Mobile }, _, { dataSources: { repository } }) => repository.asset.getById(image4Mobile),
    icon: async ({ icon }, _, { dataSources: { repository } }) => {
      if (!icon) {
        return null;
      }
      return repository.asset.getById(icon);
    },
    liveStreamCategory: async (productCategory, _, { dataSources: { repository } }) => {
      if (!productCategory.liveStreamCategory) {
        return null;
      }
      return repository.liveStreamCategory.getById(productCategory.liveStreamCategory);
    },
    productVariations: async ({ _id }, _, { dataSources: { repository }}) => {
      return repository.productVariation.getByCategory(_id);
    },
    hasChildren: async (productCategory, { hasProduct }, { dataSources: { repository } }) => repository.productCategory.getByParent(productCategory.id, hasProduct)
      .then((children) => children.length > 0),
  },
};
