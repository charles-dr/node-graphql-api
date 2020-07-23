const { Schema, model } = require('mongoose');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const collectionName = 'Vocabulary';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  translations: {
    type: Object,
    required: true,
  },
});

module.exports = new model(collectionName, schema);
