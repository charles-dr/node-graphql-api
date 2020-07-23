const { Schema, model } = require('mongoose');
const { LanguageList } = require('../lib/Enums');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const collectionName = 'LangSetting';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  version: {
    type: String,
    default: "1.0"
  },
});

module.exports = new model(collectionName, schema);
