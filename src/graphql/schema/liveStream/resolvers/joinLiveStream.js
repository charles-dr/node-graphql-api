const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { AgoraService } = require(path.resolve('src/lib/AgoraService'));
const { StreamRole, SubscriptionType } = require(path.resolve('src/lib/Enums'));
const pubsub = require(path.resolve('config/pubsub'));
const logger = require(path.resolve('config/logger'));

const errorHandler = new ErrorHandler();

const activity = {
  async checkIfLiveStreamExist(id, repository) {
    return repository.liveStream.load(id)
      .then((liveStream) => {
        if (!liveStream) {
          throw new UserInputError(`Live Stream "${id}" does not exist`, { invalidArgs: 'id' });
        }
        return liveStream;
      });
  },

  async quitFromActiveChannels( userId, repository) {
    return repository.streamChannelParticipant
      .getParticipantActiveChannels(userId)
      .then((channels) => channels.map(({ channel }) => {
        return repository.streamChannelParticipant.leaveStream(channel, userId)
      }));
  },

  async createChannelParticipant({ liveStream, user }, repository) {
    return repository.streamChannelParticipant.create({
      channel: liveStream.channel,
      token: AgoraService.buildTokenWithAccount(liveStream.channel, user.id, StreamRole.SUBSCRIBER),
      user: user.id,
      isPublisher: false,
    });
  },

  async createPrivateMessageThread({ liveStream, user }, repository) {
    const threadTag = `LiveStream:${liveStream.id}`;
    return repository.messageThread
      .findByIdsAndParticipants(liveStream.privateMessageThreads, [liveStream.streamer, user.id])
      .then((thread) => {
        if (thread) {
          return thread;
        }

        return repository.messageThread.create({
          participants: [liveStream.streamer, user.id],
          tags: [threadTag],
        })
          .then((newThread) => {
            liveStream.privateMessageThreads.push(newThread.id);
            return Promise.all([
              liveStream.save(),
              repository.userHasMessageThread.create({
                thread: newThread.id,
                user: user.id,
                readBy: Date.now(),
                muted: false,
                hidden: false,
              }),
            ]);
          })
          .then(([liveStream, userHasMessageThread]) => liveStream);
      });
  },

  async addParticipantToMessageThread({ id, user }, repository) {
    return repository.messageThread
      .findOne(id)
      .then((thread) => {
        if (!thread) {
          throw new Error(`User can not be addded to the Message Thread, because of MessageThread "${id}" does not exist!`);
        }

        if (thread.participants.some((participantId) => participantId === user.id)) {
          return true;
        }

        thread.participants.push(user.id);
        return thread.save();
      });
  },

  async createPublicMessageThread({ id, user }, repository) {
    return repository.userHasMessageThread.create({
      thread: id,
      user: user.id,
      readBy: Date.now(),
      muted: false,
      hidden: false,
    }).catch((error) => {
      logger.error(`Failed to update User Thread on join public thread for user "${user.id}". Original error: ${error}`);
    });
  },
};

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(
    args,
    { id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']] },
  );

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => activity.checkIfLiveStreamExist(args.id, repository))
    .then((liveStream) => (
      repository.streamChannelParticipant.load(liveStream.channel, user.id)
        .then((participant) => {
          if (participant && !participant.leavedAt) {
            return liveStream;
          }

          return activity.quitFromActiveChannels(user.id, repository)
            .then(() => {
              if (participant) {
                // eslint-disable-next-line no-param-reassign
                participant.leavedAt = null;
                return participant.save();
              }
              return activity.createChannelParticipant({ liveStream, user }, repository)
                .then(() => activity.createPrivateMessageThread({ liveStream, user }, repository))
                .then(() => activity.addParticipantToMessageThread({ id: liveStream.publicMessageThread, user }, repository))
                .then(() => activity.createPublicMessageThread({ id: liveStream.publicMessageThread, user }, repository));
            });
        })
        .then(() => {
          pubsub.publish(SubscriptionType.LIVE_STREAM_CHANGE, { id: liveStream._id, ...liveStream.toObject() });
          return liveStream;
        })
    ));
};
