const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const pubsub = require(path.resolve('config/pubsub'));
const { SubscriptionType } = require(path.resolve('src/lib/Enums'));

const errorHandler = new ErrorHandler();

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
    .then(() => repository.streamChannel.load(args.id))
    .then((streamChannel) => {
      if (!streamChannel) {
        throw new UserInputError(`Stream Channel ${args.data.experience} does not exist`, { invalidArgs: 'id' });
      }

      if (!user) {
        return true;
      }

      return repository.streamChannelParticipant.leaveStream(args.id, user.id)
        .then(() => {
          repository.liveStream.getOne({ channel: args.id }).then((liveStream) => {
            pubsub.publish(SubscriptionType.LIVE_STREAM_CHANGE, { id: liveStream._id, ...liveStream.toObject() });
          });
          return true;
        }).catch((error) => {
          throw new ApolloError(`Failed to leave Stream Channel. Original error: ${error.message}`, 400);
        });
    });
};
