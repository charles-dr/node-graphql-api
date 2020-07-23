const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ForbiddenError } = require('apollo-server');

const { MessageType, NotificationType, SubscriptionType } = require(path.resolve('src/lib/Enums'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const NotificationService = require(path.resolve('src/lib/NotificationService'));
const PushNotificationService = require(path.resolve('src/lib/PushNotificationService'));
const logger = require(path.resolve('config/logger'));
const pubsub = require(path.resolve('config/pubsub'));

const errorHandler = new ErrorHandler();

const arrayEquals = (_arr1, _arr2) => {
  if (
    !Array.isArray(_arr1)
    || !Array.isArray(_arr2)
    || _arr1.length !== _arr2.length
    ) {
      return false;
    }
  
  const arr1 = _arr1.concat().sort();
  const arr2 = _arr2.concat().sort();
  
  for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
          return false;
       }
  }
  
  return true;
}

module.exports = (_, { input }, { dataSources: { repository }, user }) => {
  // console.log('[user]', user); return null;
  const validator = new Validator(
    input,
    { liveStream: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']] },
    { receivers: 'required|array|minLength:1' },
  );

  validator.addPostRule(provider => {
    return repository.user.loadList(provider.inputs.receivers)
      .then(receivers => {
        receivers.forEach(receiver => {
          if (!receiver) provider.error('receivers', 'custom', `User with id "" does not exist!`);
        })
      })
  })

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
      return repository.liveStream.load(input.liveStream);
    })

    .then(async (liveStream) => {
      if (!liveStream) {
        throw new UserInputError('Livestream does not exist', { invalidArgs: 'liveStream' });
      }

      const participants = await repository.streamChannelParticipant.getChannelParticipants(liveStream.channel);
      const participant_ids = participants.map(item => item.user);
      if (!participant_ids.includes(user._id)) {
        throw new ForbiddenError('You can not write to this thread');
      }

      input.receivers.forEach(receiver => {
        if (!participant_ids.includes(receiver)) {
          throw new UserInputError(`User "${receiver}" doesn't participate in the livestream!`);
        }
      });

      const newParticipants = [...input.receivers, user._id].filter((v, i, a) => a.indexOf(v) === i);

      // check if message thread is already created in the livestream.
      const existingThreads = await repository.messageThread.findAllByIdsAndParticipants(liveStream.privateMessageThreads, newParticipants);
      const [existing] = existingThreads.filter(thread => arrayEquals(newParticipants, thread.participants))

      if (existing) {
        return existing;
      }

      const messageThread = {
        tags: [
          `LiveStream:${input.liveStream}`,
          `CreatedBy:${user._id}`
        ],
        participants: newParticipants,
      };

      return repository.messageThread.create(messageThread)
        .then(messageThread => {
          if (!messageThread) throw new Error("Failed to create a message thread!");
          liveStream.privateMessageThreads.push(messageThread._id);
          return Promise.all([
            messageThread, liveStream.save(),
            messageThread.participants.map(user_id => repository.userHasMessageThread.create({
              thread: messageThread._id,
              user: user_id,
              readBy: Date.now(),
              muted: false,
              hidden: false,
            }))
          ])
        })
        .then(([ messageThread, liveStream, [userHasMessageThread] ]) => {
          pubsub.publish(SubscriptionType.LIVE_STREAM_CHANGE, { id: liveStream._id, ...liveStream.toObject() });
          return messageThread;
        })
    })
};
