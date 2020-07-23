const { gql } = require('apollo-server');

const schema = gql`
    input PageInput {
        skip: Int = 0
        limit: Int = 10
    }

    type Pager {
        total: Int!
        skip: Int!
        limit: Int!
    }
`;

module.exports.typeDefs = [schema];
