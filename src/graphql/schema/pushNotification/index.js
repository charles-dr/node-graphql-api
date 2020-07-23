const path = require('path');
const { gql, withFilter } = require('apollo-server');

const { NotificationType } = require(path.resolve('src/lib/Enums'));

const pubsub = require(path.resolve('config/pubsub'));

const sendPushNotification = require('./resolvers/sendPushNotification');

const schema = gql`
    extend type Mutation {
      """
      Pass ID of the Notification
      Allows: authorized user
      @auth(requires: USER)
      """
      sendPushNotification(message: String!): Boolean!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Mutation: {
    sendPushNotification,
  },
};
