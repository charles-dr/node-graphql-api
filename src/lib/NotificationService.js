
const path = require('path');

const PushNotificationService = require('./PushNotificationService');

const pubsub = require(path.resolve('config/pubsub'));

class NotificationService {
  pushNotification({ user, notification }) {
    if (user.isOnline) {
      pubsub.publish('NOTIFICATION_ADDED', { id: notification._id, ...notification.toObject() });
    } else {
      PushNotificationService.pushNotification({ user, notification });
    }
  }
}

module.exports = new NotificationService();
