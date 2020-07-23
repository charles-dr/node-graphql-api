const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ForbiddenError } = require('apollo-server');

const { MessageType, NotificationType, SubscriptionType } = require(path.resolve('src/lib/Enums'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const PushNotificationService = require(path.resolve('src/lib/PushNotificationService'));
const logger = require(path.resolve('config/logger'));
const pubsub = require(path.resolve('config/pubsub'));

const errorHandler = new ErrorHandler();

module.exports = (_, { input }, { dataSources: { repository }, user }) => {
  const validator = new Validator(
    input,
    { thread: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']] },
    { type: ['required', `in:${MessageType.toList().join(',')}`] },
    { data: ['required', 'minLengh:1'] },
  );

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.messageThread.findOne(input.thread))
    .then((thread) => {
      if (!thread) {
        throw new UserInputError('Thread does not exist', { invalidArgs: 'thread' });
      }

      if (!thread.participants.includes(user._id)) {
        throw new ForbiddenError('You can not write to this thread');
      }

      return repository.messageThread.updateTime(thread._id);
    })
    .then((thread) => Promise.all([repository.message
      .addMessage({
        author: user._id,
        thread: thread._id,
        type: input.type,
        data: input.data,
        videoTime: input.videoTime,
      }),
      repository.userHasMessageThread.updateTime(thread._id, user._id, Date.now()),
    ])
      .then(([message, userThread]) => {
        if (!userThread.muted && !userThread.hidden) {
          pubsub.publish(SubscriptionType.MESSAGE_ADDED, {
            ...message.toObject(),
            id: message._id,
            thread: { ...thread.toObject(), id: thread._id },
          });

          var messageText = user.name + ' has messaged you';            // 10-06
          var device_ids = [];                                          // 10-06
          // TODO: we need to add queue here
          repository.user.loadList(thread.participants)
            .then(async (participants) => Promise.all(participants.map((participant) => {
              if (participant._id !== user.id && !participant.blackList.includes(user.id)) {
                if (participant.device_id != '' && participant.device_id != undefined)    // 10-06
                  device_ids.push(participant.device_id);       // 10-06
                repository.notification.create({
                  type: NotificationType.MESSAGE,
                  user: participant._id,
                  data: {
                    content: message.data,
                    name: user.name,
                    date: message.createdAt,
                    photo: user.photo,
                    status: '',
                    linkID: user.id,
                  },
                  tags: ['Message:message.id'],
                })
              }
            })))
            // 10-06
            .then(() => {
              console.log("receivers => ", device_ids);
              PushNotificationService.sendPushNotification({ message: messageText, device_ids });
            })
            .catch((error) => {
              logger.error(`Failed to create Notification on Add Message for user "${user._id}", Original error: ${error}`);
            });
        }

        return message;
      }));
};
