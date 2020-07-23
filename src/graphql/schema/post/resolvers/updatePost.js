const path = require('path');
const uuid = require("uuid/v4");
const { Validator } = require('node-input-validator');
const { UserInputError, ForbiddenError } = require('apollo-server');
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();
const pubsub = require(path.resolve('config/pubsub'));
const { SubscriptionType } = require(path.resolve('src/lib/Enums'));

module.exports = async (_, { id, data }, { dataSources: { repository }, user}) => {
  const validator = new Validator({ id }, {
    id: "required",
  })

  return validator.check()
    .then(async matched => {
      if (!matched) throw errorHandler.build(validator.errors);
      return Promise.all([
        repository.post.getById(id),
        data.assets ? repository.asset.getByIds(data.assets) : [],
        data.streams ? repository.liveStream.getByIds(data.streams) : []
      ])
        .then(([post, assets, streams]) => {
          if (!post) throw new UserInputError(`Post not found!`, { invalidArgs: [id] });
          if (post.user !== user.id) throw new ForbiddenError("You don't have permission to update post!");
          if (data.assets && assets.length < data.assets.length) {
            throw new UserInputError(`Assets not found!`, { invalidArgs: data.assets.filter(id => !assets.map(asset => asset.id).includes(id)) });
          }
          if (data.streams && streams.length < data.streams.length) {
            throw new UserInputError(`Livestreams not found!`, { invalidArgs: data.streams.filter(id => !streams.map(stream => stream.id).includes(id)) });
          }
          return post;
        })
    })
    .then((post) => {
      ['title', 'feed', 'asstes', 'streams'].forEach(key => {
        post[key] = data[key] !== undefined ? data[key] : post[key];
      })
      if (data.tags && typeof data.tags === 'object' && data.tags.length > 0) {
        post.tags = [...data.tags, `User:${post.user}`];
      }

      return post.save();
    })
    .then((post) => {
      pubsub.publish(SubscriptionType.POST_UPDATED, {
        ...post.toObject(),
      });
      return post;
    })
}

