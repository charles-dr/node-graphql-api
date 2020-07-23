const path = require('path');
const { withFilter } = require('apollo-server');
const pubsub = require(path.resolve('config/pubsub'));
const { SubscriptionType } = require(path.resolve('src/lib/Enums'));

module.exports = {
  resolve: payload => payload,
  subscribe: withFilter(
    () => pubsub.asyncIterator([SubscriptionType.POST_ADDED]),
    ({ user: poster }, _, { dataSources: { repository }, user }) => {
      return user.following.includes(`User:${poster}`);
    },
  )
}
