const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'LiveStreamCategory';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  order: {
    type: Number,
    required: true,
  },
  imagePath: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  hashtags: {
    type: [{
      type: String,
    }],
    default: [],
    index: true,
  },
  slug: {
    type: String,
  },
  nStreams: {
    streaming: {
      type: Number,
      default: 0,
    },
    finished: {
      type: Number,
      default: 0,
    },
  },
  translations: Object,
});

module.exports = new model(collectionName, schema);
