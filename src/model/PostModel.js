const path = require('path');
const { Schema, model } = require('mongoose');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const collectionName = "Post";

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  title: {
    type: String,
  },
  feed: {
    type: String,
  },
  user: {
    type: String,
    ref: 'User',
    index: true,
    required: true,
  },
  tags: {
    type: [{
      type: String,
    }],
    index: true,
    default: [],
  },
  assets: {
    type: [{
      type: String,
      ref: "Asset",
    }],
    default: [],
  },
  streams: {
    type: [{
      type: String,
      ref: "LiveStream"
    }],
    default: [],
  },
  deleted: {
    type: Boolean,
    default: false,
  }
});

module.exports = new model(collectionName, schema);
