const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'ProductVariation';

const TranslationSchema = new Schema({
  values: [Object],
  displayName: Object,
}, { _id: false });

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
  values: {
    type: [{
      type: String,
      required: true,
    }], 
    default: []
  },
  keyName: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  categories: {
    type: [{
      type: String,
      ref: "ProductCategory",
    }],
    default: [],
  },
  translation: {
    type: TranslationSchema,
    default: null,
  },
});

module.exports = new model(collectionName, schema);
