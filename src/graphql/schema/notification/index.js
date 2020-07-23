const path = require('path');
const { gql, withFilter } = require('apollo-server');

const { NotificationType } = require(path.resolve('src/lib/Enums'));

const pubsub = require(path.resolve('config/pubsub'));

const getNotificationCollection = require('./resolvers/getNotificationCollection');
const markNotificationAsRead = require('./resolvers/markNotificationAsRead');

const schema = gql`
    enum NotificationType {
      ${NotificationType.toGQL()}
    }

    type Notification {
      id: ID!
      data: NotificationData!
      type: NotificationType!
      createdAt: Date!
      isRead: Boolean!
    }

    type NotificationCollection {
      collection: [Notification]!
      pager: Pager
    }

    input NotificationFilterInput {
        isRead: Boolean
        type: NotificationType
      }

    extend type Query {
      """
      Allows: authorized user
      """
      notifications(filter: NotificationFilterInput = {}, page: PageInput = {}): NotificationCollection! @auth(requires: USER)
    }

    extend type Mutation {
      """
      Pass ID of the Notification
      Allows: authorized user
      """
      markNotificationAsRead(id: ID!): Notification! @auth(requires: USER)
    }

    extend type Subscription {
      """Allows: authorized user"""
      notificationAdded: Notification! @auth(requires: USER)
    }

`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    notifications: getNotificationCollection,
  },
  Mutation: {
    markNotificationAsRead,
  },
  Subscription: {
    notificationAdded: {
      resolve: (payload) => payload,
      subscribe: withFilter(
        () => pubsub.asyncIterator(['NOTIFICATION_ADDED']),
        (payload, variables, { user }) => payload.user === user.id,
      ),
    },
  },
};
