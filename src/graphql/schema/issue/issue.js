const path = require('path');
const { gql } = require('apollo-server');
const { IssueStatus, IssueUrgency } = require(path.resolve('src/lib/Enums'));

const addIssue = require('./resolvers/addIssue');
const deleteIssue = require('./resolvers/deleteIssue')
const updateIssue = require('./resolvers/updateIssue');
const issues = require('./resolvers/issues');

const schema = gql`
  enum IssueStatus {
    ${IssueStatus.toGQL()}
  }
  enum IssueUrgency {
    ${IssueUrgency.toGQL()}
  }

  type Issue {
    id: ID!
    # issuer: User
    name: String!
    phone: String!
    email: String
    urgency: IssueUrgency!
    category: IssueCategory!
    message: String!
    attachments: [Asset]!
    note: String @auth(requires: ADMIN)
    status: IssueStatus!
  }
  
  type IssueCollection {
    collection: [Issue]!
    pager: Pager
  }

  input AddIssueInput {
    name: String!
    phone: String!
    email: String
    urgency: IssueUrgency!
    category: String!
    message: String!
    attachments: [ID!]
  }

  input updateIssueInput {
    name: String
    phone: String
    email: String
    urgency: IssueUrgency
    category: String
    message: String
    attachments: [ID!]
  }

  enum IssueSortFeature {
    CREATED_AT
  }

  input IssueSortInput {
    feature: IssueSortFeature! = CREATED_AT
    type: SortTypeEnum! = ASC
  }

  input IssueFilterInput {
    searchQuery: String
    categories: [ID!]
  }

  extend type Query {
    issue(id: ID!): Issue @auth(requires: USER)
    issues(filter: IssueFilterInput = {}, sort: IssueSortInput = {}, page: PageInput = {}): IssueCollection! @auth(requires: USER)
  }

  extend type Mutation {
    addIssue(data: AddIssueInput!): Issue!
    updateIssue(id: ID!, data: updateIssueInput!): Issue!
    deleteIssue(id: ID!): Boolean @auth(requires: USER)
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    issue: async (_, { id }, { dataSources: { repository }}) => repository.issue.getById(id),
    issues,
  },
  Mutation: {
    addIssue,
    deleteIssue,
    updateIssue,
  },
  Issue: {
    category: async ({ category }, _, { dataSources: { repository } }) => {
      return repository.issueCategory.getById(category);
    },
    // issuer: async ({ issuer }, _, { dataSources: { repository } }) => {
    //   return repository.user.getById(issuer);
    // },
    attachments: async ({ attachments }, _, { dataSources: { repository } }) => repository.asset.getByIds(attachments),
  },
}
