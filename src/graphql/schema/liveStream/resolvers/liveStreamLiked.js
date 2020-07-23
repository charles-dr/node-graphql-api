const path = require('path');
const { withFilter } = require('apollo-server');
const pubsub = require(path.resolve('config/pubsub'));
const { SubscriptionType } = require(path.resolve('src/lib/Enums'));

module.exports = {
  resolve: payload => payload,
  subscribe: withFilter(
    () => pubsub.asyncIterator([SubscriptionType.LIVE_STREAM_LIKED]),
    ({ liveStream }, { ids }, { dataSources: { repository }, user }) => {
      return ids.includes(liveStream.id);
    },
  )
}
