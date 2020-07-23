const path = require('path');
const { Schema, model } = require('mongoose');

const { StreamChannelStatus, StreamChannelType, StreamRecordStatus } = require(path.resolve('src/lib/Enums'));
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const streamRecordSchema = new Schema({
  enabled: Boolean,
  status: {
    type: String,
    enum: StreamRecordStatus.toList(),
  },
  resourceId: String,
  sid: String,
  sources: {
    type: [{
      type: String,
      ref: 'StreamSource',
      required: true,
    }],
    default: [],
  },
}, { _id: false });

const collectionName = 'StreamChannel';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  type: {
    type: String,
    enum: StreamChannelType.toList(),
  },
  status: {
    type: String,
    enum: StreamChannelStatus.toList(),
  },
  record: streamRecordSchema,
  startedAt: {
    type: Date,
    default: null,
  },
  finishedAt: {
    type: Date,
    default: null,
  },
});

module.exports = new model(collectionName, schema);
