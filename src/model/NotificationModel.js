const path = require('path');
const { Schema, model } = require('mongoose');

const { NotificationType } = require(path.resolve('src/lib/Enums'));
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const collectionName = 'Notification';
const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  type: {
    type: String,
    enum: NotificationType.toList(),
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  user: {
    type: String,
    ref: 'User',
    required: true,
  },
  data: {
    type: Schema.Types.Mixed,
  },
  tags: [String],
});

schema.methods.markRead = function () {
  this.isRead = true;
  return this.save();
};

module.exports = new model(collectionName, schema);
