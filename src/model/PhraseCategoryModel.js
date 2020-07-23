const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');


const collectionName = 'PhraseCategory';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  order: {
    type: Number,
  },
  parent: {
    type: String,
    default: null,
  },
  parents: [{
    type: String,
  }],
  hasChildren: {
    type: Boolean,
    required: true,
    default: false,
  },
  level: {
    type: Number,
    default: 1,
  },
  name: {
    type: String,
    required: true,
    index: true,
  }
});

module.exports = new model(collectionName, schema);
