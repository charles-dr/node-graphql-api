const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError, ForbiddenError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { AgoraService } = require(path.resolve('src/lib/AgoraService'));
const { StreamChannelStatus, StreamRole, SubscriptionType } = require(path.resolve('src/lib/Enums'));
const logger = require(path.resolve('config/logger'));
const pubsub = require(path.resolve('config/pubsub'));
const streamService = require(path.resolve('src/lib/StreamService'));
const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { user, dataSources: { repository } }) => {
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

      if (streamChannel.status === StreamChannelStatus.STREAMING) {
        throw new ApolloError('Stream is already started', 400);
      }

      if (streamChannel.status === StreamChannelStatus.FINISHED) {
        throw new ApolloError('You cannot start finished stream', 400);
      }
      return repository.streamChannelParticipant.load(args.id, user.id);
    })
    .then((participant) => {
      if (!participant || !participant.isPublisher) {
        throw new ForbiddenError('Only streamer can start the stream', 403);
      }

      return repository.streamChannel.start(args.id);
    })
    .then((channel) => {
      if (channel.record.enabled) {
        // AgoraService.recording.acquire(args.id, '1')
        //   .then(({ resourceId }) => AgoraService.recording.start(args.id, '1', resourceId, AgoraService.buildTokenWithAccount(args.id, '1', StreamRole.SUBSCRIBER)))
        //   .then(({ resourceId, sid }) => repository.streamChannel.startRecording(args.id, { resourceId, sid }))
        //   .catch((error) => {
        //     logger.error(`Failed to start record StreamChannel(${args.id}). Original error: ${error}`);
        //     repository.streamChannel.failRecording(args.id);
        //   });
      }
      return streamService.updateStreamStatusByChannel(args.id, StreamChannelStatus.STREAMING)
    })
    .then(([ liveStream, streamChannel ]) => {
      pubsub.publish(SubscriptionType.LIVE_STREAM_CHANGE, { id: liveStream._id, ...liveStream.toObject() });
      return streamChannel;
    });
};
