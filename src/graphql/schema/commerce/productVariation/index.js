const path = require('path');
const { gql } = require('apollo-server');
const { ThemeType } = require(path.resolve('src/lib/Enums'));

const addProductVariation = require('./resolvers/addProductVariation');
const updateProductVariation = require('./resolvers/updateProductVariation');
const deleteProductVariation = require('./resolvers/deleteProductVariation');
const productVariations = require('./resolvers/productVariations');
const productVariationsByKeyword = require('./resolvers/productVariationsByKeyword');
const uploadBulkProductVariations = require('./resolvers/uploadBulkProductVariations');
const attributeFilter = require('./resolvers/attributeFilter');

const schema = gql`

  type ProductVariation {
    id: ID!
    """
      - used on admin & seller side
    """
    name: String!
    description: String
    values(language: LanguageList): [String!]!
    """
      - used in productAttributes.variations.name
      - must be unique in the collection
    """
    keyName: String!
    """
      - used to name the filter row in the group filter.
    """
    displayName(language: LanguageList): String!
  }

  input ProductVariationInput {
    name: String!
    description: String
    values: [String!]!
    keyName: String!
    displayName: String!
  }

  input ProductVariationUpdateInput {
    name: String
    description: String
    values: [String!]
    keyName: String
    displayName: String
  }

  input ProductVariationFilterInput {
    searchQuery: String
  }

  input ProductVariationSortInput {
    feature: ThemeSortFeature! = CREATED_AT
    type: SortTypeEnum! = ASC
  }

  enum ProductVariationSortFeature {
    NAME
    CREATED_AT
  }

  type ProductVariationCollection {
    collection: [ProductVariation]!
    pager: Pager
  }

  type FailedProductVariations{
      row: [Int!]
      errors: [String!]
    }

  type UploadedProductVariations{
      total: Int!
      success: Int!
      failed: Int!
      failedList: FailedProductVariations!
    }
  type AttributeFilter {
    productVariations: [ProductVariation!]
    productCategories: [ProductCategory!]
  }

  input AttributeFilterInput {
    searchQuery: String
  }

  extend type Query {
    productVariation(id: ID!): ProductVariation
    productVariationByKeyName(keyName: String!): ProductVariation
    productVariations(
        filter: ProductVariationFilterInput = {}, 
        sort: ProductVariationSortInput = {}, 
        page: PageInput = {}): ProductVariationCollection! @auth(requires: USER)
    """
      @deprecated: use "attributeFilter" instread.
    """
    productVariationsByKeyword(keyword: String!): [ProductVariation] @deprecated(reason: "Use 'attributeFilter' instead")
    attributeFilter(data: AttributeFilterInput): AttributeFilter

  }

  extend type Mutation {
    addProductVariation(data: ProductVariationInput!): ProductVariation! @auth(requires: USER)
    updateProductVariation(id: ID!, data: ProductVariationUpdateInput): ProductVariation @auth(requires: USER)
    deleteProductVariation(id: ID!): Boolean! @auth(requires: USER)
    uploadBulkProductVariations(file: Upload!): UploadedProductVariations
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    productVariation: async (_, { id }, { dataSources: { repository } } ) => {
      return repository.productVariation.getById(id);
    },
    productVariationByKeyName: async (_, { keyName }, { dataSources: { repository } }) => {
      return repository.productVariation.getByKeyName(keyName);
    },
    productVariations,
    productVariationsByKeyword,
    attributeFilter,
  },
  Mutation: {
    addProductVariation,
    updateProductVariation,
    deleteProductVariation,
    uploadBulkProductVariations,
  },
  ProductVariation: {
    displayName: ({ displayName, translation }, { language = "EN" }) => {
      return Promise.resolve().then(() => translation.displayName[language.toLowerCase()])
        .then(dn => dn || displayName)
        .catch(() => displayName);
    },
    values: ({ values, translation }, { language = "EN" }) => {
      return Promise.resolve().then(() => translation.values.map((val, i) => val[language.toLowerCase()] || values[i]))
        .then((tValues) => {
          if (tValues.length < values.length) throw new Error('Translation wrong!');
          return tValues;
        })
        .catch(() => values);
    }
  },
};
