const path = require('path');
const { gql } = require('apollo-server');

const { LoginProvider } = require(path.resolve('src/lib/Enums'));

const generateAccessToken = require('./resolvers/generateAccessToken');
const generateAccessTokenByPhone = require('./resolvers/generateAccessTokenByPhone');
const generateAccessTokenByOAuth2 = require('./resolvers/generateAccessTokenByOAuth2');
const generateAccessTokenByOAuth2Web = require('./resolvers/generateAccessTokenByOAuth2Web');
const anonymousLogin = require('./resolvers/anonymousLogin');

const schema = gql`
  enum LoginProvider {
    ${LoginProvider.toGQL()}
  }

  input LoginInput {
    email: String!
    password: String!
    ip: String
    userAgent: String
  }

  input LoginInputByPhone {
    phone: String!
    password: String!
    ip: String
    userAgent: String
  }

  input OAuth2LoginInput {
    provider: LoginProvider!
    token: String!
  }

  input AnonymousLoginInput {
    anonymousId: ID!
    ip: String
    userAgent: String
  }

  extend type Mutation {
    generateAccessToken(data: LoginInput!): String!
    generateAccessTokenByPhone(data: LoginInputByPhone!): String!
    generateAccessTokenByOAuth2(data: OAuth2LoginInput!): String!
    generateAccessTokenByOAuth2Web(data: OAuth2LoginInput!): String!
    anonymousLogin(data: AnonymousLoginInput!): String!
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Mutation: {
    generateAccessToken,
    generateAccessTokenByPhone,
    generateAccessTokenByOAuth2,
    generateAccessTokenByOAuth2Web,
    anonymousLogin,
  },
};
