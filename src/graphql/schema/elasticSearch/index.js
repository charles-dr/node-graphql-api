const { gql } = require('apollo-server');

const elasticSearch = require('./resolvers/elasticSearch');
const searchProducts = require('./resolvers/searchProducts');

const schema = gql`
    type Result {
        title: String!
        id: ID!
        assets: Asset
        type: String!
    }

    type ResultCollection {
        collection: [Result!]!
        pager: Pager
    }

    type ProductsCollection {
        collection: [Product!]!
        pager: Pager
    }

    extend type Query {
        elasticSearch(
            category: String!
            searchKey: String!
            page: PageInput = {}
        ): ResultCollection!
        searchProducts(
            searchKey: String!
            page: PageInput = {}
        ): ProductsCollection!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    elasticSearch,
    searchProducts,
  },
  Result: {
    assets: async ({ assets }, _, { dataSources: { repository } }) => (
      repository.asset.load(assets)
    ),
  },
};
