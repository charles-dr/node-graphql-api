const { Schema, model } = require('mongoose');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');
const { LanguageList } = require('../lib/Enums')

const collectionName = 'TermsCondition';
const schema = new Schema({
  // ...uuidField(collectionName),
  ...createdAtField,

  prefix: {
    type: String,
    required: true,
  },
  englishTitle: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  html: {
    type: String,
    required: true,
  },
  language: {
      type: String,
      enum: LanguageList.toList()
  }
});

module.exports = new model(collectionName, schema);
