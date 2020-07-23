/* eslint-disable no-param-reassign */
const path = require('path');
const { gql } = require('apollo-server');

const logger = require(path.resolve('config/logger'));

const mutation = gql`
    mutation generateAccessToken($email: String!, $password: String!) {
      generateAccessToken(data: {email: $email, password: $password})
    }
`;

module.exports.handler = async (client, context, data) => {
  logger.info('[fixture] AccessToken execution!');
  return Promise.all(data.users.map((variables) => (
    client
      .mutate({ mutation, variables })
      .then(({ data: { generateAccessToken } }) => {
        context.users[variables.email].accessToken = generateAccessToken;
      })
  )));
};
