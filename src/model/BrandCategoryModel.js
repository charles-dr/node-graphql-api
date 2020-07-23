const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'BrandCategory';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  name: {
    type: String,
    required: true,
    index: true,
  },
  isRecommended: {
    type: Boolean,
    default: false,
  },
  hashtags: {
    type: [{
      type: String,
    }],
    default: [],
    index: true,
  },
  translations: Object,
});

module.exports = new model(collectionName, schema);