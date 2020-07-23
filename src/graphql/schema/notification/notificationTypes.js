const { gql } = require('apollo-server');

const schema = gql`
    interface NotificationData {
      text: String!
    }

    type MessageNotificationData implements NotificationData {
      text: String!
      author: User!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  NotificationData: {
    __resolveType(data, context, info) {
      if (data.author) {
        return 'MessageNotificationData';
      }

      return null;
    },
  },
  MessageNotificationData: {
    author(messageNotificationData, args, { dataSources: { repository } }) {
      return repository.user.load(messageNotificationData.author);
    },
  },
};
