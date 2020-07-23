const path = require('path');
const { Validator } = require('node-input-validator');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const pubsub = require(path.resolve('config/pubsub'));
const { SubscriptionType } = require(path.resolve('src/lib/Enums'));

const errorHandler = new ErrorHandler();

const activity = {
  publishLikeEvent: async ({ liveStream, user }, repository) => {
    return repository.like.load(liveStream.getTagName(), user.id)
      .then((liked) => {
        return pubsub.publish(SubscriptionType.LIVE_STREAM_LIKED, {
          liveStream: { ...liveStream.toObject(), id: liveStream._id },
          user: { ...user.toObject(), id: user._id },
          isLiked: !!liked,
        });
      });    
  },
}

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(args, {
    id: 'required',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.like.toggleLike(`LiveStream:${args.id}`, user.id))
    .then(() => repository.like.load(`LiveStream:${args.id}`, user.id))
    .then((like) => {
      if (like) { 
        return repository.liveStream.toggleLike(args.id, 1); 
      } else { 
        return repository.liveStream.toggleLike(args.id, -1); 
      }
    })
    .then(() => repository.liveStream.load(args.id))
    .then(async (liveStream) => {
      pubsub.publish(SubscriptionType.LIVE_STREAM_CHANGE, { id: liveStream._id, ...liveStream.toObject() });
      await activity.publishLikeEvent({ liveStream, user }, repository);
      return liveStream;
    });
};
