const { gql } = require('apollo-server');
const uuid = require('uuid/v4');

const schema = gql`
    type CustomCarrier {
        id: ID!
        name: String!
    }
    
    input CustomCarrierInput{
      name: String!
    }

    type CustomCarrierCollection {
      collection: [CustomCarrier]!
      pager: Pager
  }

    extend type Query {
      """
      Allows: authorized user
      Fetch carriers which User can use in his country
      """
      customecarriers: [CustomCarrier]! @auth(requires: USER)
      searchCustomCarrier(query: String!, page: PageInput = {}): CustomCarrierCollection!
    }

    extend type Mutation {
      addCustomCarrier(data:CustomCarrierInput!): CustomCarrier! 
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    customecarriers(_, args, { dataSources: { repository }, user }) {
      return repository.customCarrier.getAll({});
    },
    searchCustomCarrier: async (_, { query, page }, { dataSources: { repository } }) => {
      const result = {
        collection: [],
        pager: {
          ...page,
          total: 0,
        },
      };

      if (query.length < 1) {
        return result;
      }

      return Promise.all([
        repository.customCarrier.searchByName(query, page),
        repository.customCarrier.getCountBySearch(query),
      ])
        .then(([collection, total]) => {
          result.collection = collection || [];
          result.pager.total = total;
          return result;
        });
    },
  },
  Mutation: {
    addCustomCarrier: async (_, args, { dataSources: { repository } }) => repository.customCarrier.findOrCreate({
      name: args.data.name,
    }),
  },
};
