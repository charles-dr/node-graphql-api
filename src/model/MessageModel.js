const path = require('path');
const { Schema, model } = require('mongoose');

const { MessageType } = require(path.resolve('src/lib/Enums'));
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const collectionName = 'Message';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  author: {
    type: String,
    ref: 'User',
    required: true,
  },
  thread: {
    type: String,
    ref: 'MessageThread',
    required: true,
  },
  type: {
    type: String,
    enum: MessageType.toList(),
  },
  data: {
    type: String,
    required: true,
  },
  videoTime: {
    type: Number,
    default: 0,
  }
});

module.exports = new model(collectionName, schema);
