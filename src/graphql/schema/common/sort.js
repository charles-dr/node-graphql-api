const { gql } = require('apollo-server');

const schema = gql`
    enum SortTypeEnum {
        DESC
        ASC
    }
`;

module.exports.typeDefs = [schema];
