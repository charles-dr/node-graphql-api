const path = require('path');
const { gql } = require('apollo-server');

const addIssueCategory = require('./resolvers/addIssueCategory');

const schema = gql`
  type IssueCategory {
    id: ID!
    name: String!
    notifyEmails: [String]!
  }

  input AddIssueCategoryInput {
    name: String!
    emails: [String]!
  }

  extend type Query {
    issueCategory(id: ID!): IssueCategory
    issueCategories: [IssueCategory]
  }

  extend type Mutation {
    addIssueCategory(data: AddIssueCategoryInput): IssueCategory! @auth(requires: ADMIN)
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    issueCategory: async (_, { id }, { dataSources: { repository }}) => repository.issueCategory.getById(id),
    issueCategories: async (_, __, { dataSources: { repository }}) => repository.issueCategory.getAll({}),
  },
  Mutation: {
    addIssueCategory,
  },
}
