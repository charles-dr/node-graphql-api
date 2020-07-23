const { gql } = require('apollo-server');

const schema = gql`
    input LatLngInput {
        latitude: Float!
        longitude: Float!
    }

    type LatLng {
        latitude: Float!
        longitude: Float!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {};
