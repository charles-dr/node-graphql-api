const { PubSub } = require('apollo-server');
const { RedisPubSub } = require('graphql-redis-subscriptions');
const Redis = require('ioredis');
const { redis } = require('./index');

const options = {
  host: redis.host,
  port: redis.port,
  retryStrategy: (times) => Math.min(times * 50, 2000),
};

module.exports = new RedisPubSub({
  publisher: new Redis(options),
  subscriber: new Redis(options)
});
