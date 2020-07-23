const path = require('path');
const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const { ComplaintReason } = require(path.resolve('src/lib/Enums'));

const collectionName = 'ReportComplaint';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  reporter: {
    type: String,
    ref: 'User',
    index: true,
    required: true,
  },
  user: {
    type: String,
    ref: 'User',
    index: true,
  },
  product: {
    type: String,
    ref: 'Product',
    index: true,
  },
  liveStream: {
    type: String,
    ref: 'LiveStream',
    index: true,
  },
  reasons: [{
    type: String,
    enum: ComplaintReason.toList(),
    required: true,
    index: true,
  }],
});

module.exports = new model(collectionName, schema);
