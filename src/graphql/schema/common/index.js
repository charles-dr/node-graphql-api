const { gql } = require('apollo-server');
const { GraphQLJSON, GraphQLJSONObject } = require('graphql-type-json');

const schema = gql`
    scalar JSON
    scalar JSONObject
    type Query {
        health: JSON
    }

    type Mutation {
        _empty: String
    }

    type Subscription {
      _empty: String
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    health: () => ({ status: 'pass' }),
  },
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,
};
