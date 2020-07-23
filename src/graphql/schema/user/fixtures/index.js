/* eslint-disable no-param-reassign */
const { gql } = require('apollo-server');
const path = require('path');

const logger = require(path.resolve('config/logger'));

const mutation = gql`
    mutation registerUser($email: String!, $password: String!) {
        addUser(data: {email: $email, password: $password}) {
            id
            email
        }
    }
`;

const userData = [
  { email: 'bob@domain.com', password: 'Test123456' },
  { email: 'john@domain.com', password: 'Test123456' },
  { email: 'bill@domain.com', password: 'Test123456' },
  { email: 'esrael@domain.com', password: 'Test123456' },
];

module.exports.data = {
  users: userData,
};

module.exports.handler = async (client, context, data) => {
  logger.info('[fixture] User execution!');
  context.users = {};
  return Promise.all(userData.map((variables) => (
    client
      .mutate({ mutation, variables })
      .then(({ data: { addUser: { id, email } } }) => {
        context.users[email] = { id };
      })
  )));
};
