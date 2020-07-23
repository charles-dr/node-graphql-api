const { Schema, model } = require('mongoose');
const { OrientationMode, StreamChannelStatus, VideoTag } = require('../lib/Enums');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const collectionName = 'LiveStream';

const streamProductDurationSchema = new Schema({
  product: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    // required: true,
  },
}, { _id: false });

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  streamer: {
    type: String,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: StreamChannelStatus.toList(),
  },
  experience: {
    type: String,
    required: true,
    index: true,
  },
  categories: {
    type: [String],
    required: true,
    index: true,
  },
  city: {
    type: String,
    // ref: 'City',
  },
  preview: {
    type: [String],
    ref: 'Asset',
  },
  previewVideo: {
    type: String,
    ref: 'Asset',
  },
  channel: {
    type: String,
    ref: 'StreamChannel',
  },
  publicMessageThread: {
    type: String,
    ref: 'MessageThread',
    required: true,
  },
  privateMessageThreads: [{
    type: String,
    ref: 'MessageThread',
  }],
  // products: [{
  //   type: String,
  //   ref: 'Product',
  // }],
  realViews: {
    type: Number,
    required: true,
    index: true,
  },
  realLikes: {
    type: Number,
    required: true,
    index: true,
  },
  fakeViews: {
    type: Number,
    required: true,
  },
  fakeLikes: {
    type: Number,
    required: true,
  },
  length: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
  },
  startTime: {
    type: Date,
    default: null,
  },
  productDurations: [streamProductDurationSchema],
  orientation: {
    type: String,
    enum: OrientationMode.toList(),
    default: OrientationMode.LANDSCAPE,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  thumbnail: {
    type: String,
    ref: 'Asset',
  },
  hashtags: {
    type: [{
      type: String,
    }],
    default: [],
    index: true,
  },
  videoTags: {
    type: [{
      type: String,
      enum: VideoTag.toList(),
    }],
    default: [],
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  translated: {
    type: Number,
    default: 0,
  },
});

schema.methods.getTagName = function getTagName() {
  return `LiveStream:${this._id}`;
};

module.exports = new model(collectionName, schema);
