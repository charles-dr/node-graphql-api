const path = require('path');
const { gql } = require('apollo-server');

const { ComplaintReason } = require(path.resolve('src/lib/Enums'));

const blockUser = require('./resolvers/blockUser');
const reportComplaint = require('./resolvers/reportComplaint');

const schema = gql`
    enum ComplaintReason {
        ${ComplaintReason.toGQL()}
    }
    
    input ReportComplaintInput {
        user: ID
        product: ID
        liveStream: ID
        reasons: [ComplaintReason!]
    }
      
    extend type Mutation {
        """Allows: authorized user"""
        blockUser(user: ID!): Boolean! @auth(requires: USER)
        """Allows: authorized user"""
        reportComplaint(data: ReportComplaintInput!): Boolean! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Mutation: {
    blockUser,
    reportComplaint,
  },
};
