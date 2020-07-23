const { gql } = require('apollo-server');

const schema = gql`
    type PayoutOrder {
        id: ID!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {

};
