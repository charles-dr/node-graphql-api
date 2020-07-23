const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'LiveStreamExperience';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  name: {
    type: String,
    required: true,
  }, 
  description: {
    type: String,
  }, 
  image: {
    type: String,
  },
  order: {
    type: Number,
    required: true,
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
  translations: {
    name: Object,
    description: Object,
  },
});

module.exports = new model(collectionName, schema);
