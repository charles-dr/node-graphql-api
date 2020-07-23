const { Schema, model } = require('mongoose');
const { LanguageList } = require('../lib/Enums');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'Language';

const schema = new Schema({
  _id: {
    type: String,
    enum: LanguageList.toList(),
    default: LanguageList.EN,
  },
  ...createdAtField,

  name: {
    type: String,
  },
});

module.exports = new model(collectionName, schema);
