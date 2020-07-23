const path = require('path');
const { gql } = require('apollo-server');
const {
  AuthenticationError, ForbiddenError, UserInputError, ApolloError,
} = require('apollo-server');

const config = require(path.resolve('config'));

const schema = gql`
    extend type Query {
      errorNotAuthorize: String!
      errorNoPermissions: String!
      errorWrongInput: String!
      errorHandledError: String!
      errorUnhandledError: String!
      errorWithoutAnswer: String!
    }
`;

module.exports.typeDefs = !config.isDebugMode ? [] : [schema];

module.exports.resolvers = !config.isDebugMode ? {} : {
  Query: {
    errorNotAuthorize() {
      throw new AuthenticationError('UNAUTHENTICATED');
    },
    errorNoPermissions() {
      throw new ForbiddenError('FORBIDDEN');
    },
    errorWrongInput() {
      throw new UserInputError('Wrong user input', { invalidArgs: 'name' });
    },
    errorUnhandledError() {
      throw new Error('Unhandled server error');
    },
    errorHandledError() {
      throw new ApolloError('Handled server error', 400);
    },
    errorWithoutAnswer() {
      // eslint-disable-next-line no-unused-vars
      return new Promise((resolve, reject) => {});
    },
  },
};
