const path = require('path');
const { gql } = require('apollo-server');
const { ThemeType } = require(path.resolve('src/lib/Enums'));

const addTheme = require('./resolvers/addTheme');
const updateTheme = require('./resolvers/updateTheme');
const deleteTheme = require('./resolvers/deleteTheme');
const themes = require('./resolvers/themes');

const schema = gql`
  enum ThemeType {
    ${ThemeType.toGQL()}
  }

  """
    ### start_time & end_time
      required for the type "LIMITED_TIME" only
  """
  type Theme {
    id: ID!
    name: String!
    thumbnail: Asset
    hashtags: [String]
    productCategories: [ProductCategory]
    brandCategories: [BrandCategory]
    brands: [Brand]
    liveStreams: [LiveStream]
    liveStreamCategories: [LiveStreamCategory]
    type: ThemeType!
    """
      needed for type "LIMITED_TIME" only
    """
    start_time: Date
    """
      needed for type "LIMITED_TIME" only
    """
    end_time: Date
    order: Int
    featureProduct: Product
  }

  """
    ### start_time & end_time
      required for the type "LIMITED_TIME" only
  """
  input ThemeInput {
    name: String!
    thumbnail: String!
    hashtags: [String!]!
    productCategories: [String]
    brandCategories: [String]
    brands: [String]
    liveStreams: [String]
    liveStreamCategories: [String]
    type: ThemeType = NORMAL
    start_time: Date
    end_time: Date
    order: Int
    featureProduct: ID
  }

  input ThemeUpdateInput {
    name: String
    thumbnail: String
    hashtags: [String]
    productCategories: [String]
    brandCategories: [String]
    brands: [String]
    type: ThemeType
    start_time: Date
    end_tiem: Date
    order: Int
    featureProduct: ID
  }

  """
    ### time
      required for the type "LIMITED_TIME" only to filter themes by "start_time" and "end_time".
      Set currnet ISO time in default on calls from client side(app, website).
  """
  input ThemeFilterInput {
    searchQuery: String
    type: ThemeType
    time: Date
  }

  input ThemeSortInput {
    feature: ThemeSortFeature! = CREATED_AT
    type: SortTypeEnum! = ASC
  }

  enum ThemeSortFeature {
    NAME
    CREATED_AT
    ORDER
  }

  type ThemeCollection {
    collection: [Theme]!
    pager: Pager
  }

  extend type Query {
    theme(id: ID!): Theme
    themes(
        filter: ThemeFilterInput = {}, 
        sort: ThemeSortInput = {}, 
        page: PageInput = {}): ThemeCollection!
  }

  extend type Mutation {
    addTheme(data: ThemeInput!): Theme! @auth(requires: USER)
    updateTheme(id: ID!, data: ThemeUpdateInput): Theme @auth(requires: USER)
    deleteTheme(id: ID!): Boolean! @auth(requires: USER)
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    theme: async (_, { id }, { dataSources: { repository } } ) => {
      return repository.theme.getById(id);
    },
    themes,
  },
  Mutation: {
    addTheme,
    updateTheme,
    deleteTheme,
  },
  Theme: {
    thumbnail: async (theme, _, { dataSources: { repository }}) => {
      return theme.thumbnail ? repository.asset.getById(theme.thumbnail) : null;
    },
    productCategories: async (theme, _, { dataSources: { repository } }) => {
      return theme.productCategories && theme.productCategories.length ? repository.productCategory.findByIds(theme.productCategories) : [];
    },
    brandCategories: async (theme, _, { dataSources: { repository }}) => {
      return theme.brandCategories && theme.brandCategories.length ? repository.brandCategory.findByIds(theme.brandCategories) : [];
    },
    brands: async (theme, _, { dataSources: { repository }}) => {
      return theme.brands && theme.brands.length ? repository.brand.getByIds(theme.brands) : [];
    },
    liveStreams: async ({ liveStreams }, _, { dataSources: { repository } }) => {
      return liveStreams.length ? repository.liveStream.getByIds(liveStreams) : [];
    },
    liveStreamCategories: async ({ liveStreamCategories }, _, { dataSources: { repository } }) => {
      return liveStreamCategories ? repository.liveStreamCategory.getByIds(liveStreamCategories) : []; 
    },
    type: async (theme) => (theme.type || "NORMAL"),
    featureProduct: async ({ featureProduct }, _, { dataSources: { repository } }) => repository.product.getById(featureProduct),
  }
};
