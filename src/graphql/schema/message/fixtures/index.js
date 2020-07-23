/* eslint-disable no-param-reassign */
const path = require('path');
const { gql } = require('apollo-server');
const faker = require('faker');

const { MessageType } = require(path.resolve('src/lib/Enums'));
const logger = require(path.resolve('config/logger'));

const mutation = gql`
  mutation addMessage($thread: ID!, $type: MessageTypeEnum!, $data: String!) {
    addMessage(input: {
      thread: $thread,
      type: $type,
      data: $data,
    }) {
      id
      author {
        id
        email
      }
      thread {
        id
      }
      type
      data
    }
  }
`;

const messagesData = [
  {
    email: 'john@domain.com',
    type: MessageType.TEXT,
    data: faker.lorem.sentence(),
  },
  {
    email: 'bill@domain.com',
    type: MessageType.TEXT,
    data: faker.lorem.sentence(),
  },
  {
    email: 'bob@domain.com',
    type: MessageType.TEXT,
    data: faker.lorem.sentence(),
  },
  {
    email: 'esrael@domain.com',
    type: MessageType.TEXT,
    data: faker.lorem.sentence(),
  },
];

module.exports.data = { messages: messagesData };

module.exports.handler = async (client, context) => {
  logger.info('[fixture] Message execution!');
  context.messages = [];
  return Promise.all(messagesData.map((variables) => {
    const user = context.users[variables.email];

    return client
      .mutate({
        mutation,
        variables: {
          ...variables,
          thread: user.liveStreams[0].publicMessageThread.id,
        },
        context: {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        },
      }).then(({ data: { addMessage } }) => {
        context.messages.push(addMessage);
      });
  }));
};
