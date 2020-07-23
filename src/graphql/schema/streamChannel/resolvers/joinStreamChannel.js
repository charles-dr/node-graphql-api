const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { AgoraService } = require(path.resolve('src/lib/AgoraService'));
const { StreamRole, SubscriptionType } = require(path.resolve('src/lib/Enums'));
const pubsub = require(path.resolve('config/pubsub'));

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
        throw new UserInputError(`Stream Channel ${args.id} does not exist`, { invalidArgs: 'id' });
      }

      return repository.streamChannelParticipant.load(args.id, user ? user.id : null)
        .then((existingParticipant) => {
          if (existingParticipant && !existingParticipant.leavedAt) {
            return streamChannel;
          }

          return (user ? repository.streamChannelParticipant.getParticipantActiveChannels(user.id) : Promise.resolve([]))
            .then((channels) => {
              channels.forEach((c) => repository.streamChannelParticipant.leaveStream(c.id, user.id));

              if (existingParticipant) {
                return repository.streamChannelParticipant.rejoinStream(streamChannel.id, user.id);
              }

              // const token = AgoraService.buildTokenWithAccount(streamChannel.id, user ? user.id : 'guest', StreamRole.SUBSCRIBER);
              const token = '';

              return repository.streamChannelParticipant.create({
                channel: args.id,
                token,
                user: user ? user.id : null,
                isPublisher: false,
              });
            }).then(() => {
              repository.liveStream.getOne({ channel: args.id }).then((liveStream) => {
                pubsub.publish(SubscriptionType.LIVE_STREAM_CHANGE, { id: liveStream._id, ...liveStream.toObject() });
              });
              return streamChannel;
            });
        });
    });
};
