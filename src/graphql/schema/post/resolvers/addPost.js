const path = require('path');
const uuid = require("uuid/v4");
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();
const pubsub = require(path.resolve('config/pubsub'));
const { SubscriptionType } = require(path.resolve('src/lib/Enums'));

module.exports = async (_, { data }, { dataSources: { repository }, user}) => {
  const validator = new Validator(data, {
    feed: "required",
  })

  return validator.check()
    .then(async matched => {
      if (!matched) throw errorHandler.build(validator.errors);
      return Promise.all([
        data.assets ? repository.asset.getByIds(data.assets) : [],
        data.streams ? repository.liveStream.getByIds(data.streams) : []
      ])
        .then(([assets, streams]) => {
          if (assets.length < data.assets.length) {
            throw new UserInputError(`Assets not found!`, { invalidArgs: data.assets.filter(id => !assets.map(asset => asset.id).includes(id)) });
          }
          if (streams.length < data.streams.length) {
            throw new UserInputError(`Livestreams not found!`, { invalidArgs: data.streams.filter(id => !streams.map(stream => stream.id).includes(id)) });

          }
        })
    })
    .then(() => {
      const { title, feed, assets, streams, tags } = data;
      const post = {
        _id: uuid(),
        tags: [...tags, user.getTagName()],
        user: user.id,
        title, feed, assets, streams, tags,
      };

      return repository.post.create(post);
    })
    .then((post) => {
      pubsub.publish(SubscriptionType.POST_ADDED, {
        ...post.toObject(),
      });
      return post;
    })
}
