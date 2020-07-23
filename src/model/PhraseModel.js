const { Schema, model } = require('mongoose');
const path = require('path');
const { LanguageList } = require(path.resolve('src/lib/Enums'));
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'Phrase';

const phraseItemSchema = new Schema({
  lang: {
    type: String,
    enum: LanguageList.toList(),
  },
  text: {
    type: String,
  }
}, { _id: false });

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  slug: {
    type: String,
  },
  translations: [phraseItemSchema],
  category: {
    type: String,
    ref: 'PhraseCategory'
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true, 
  }
});

module.exports = new model(collectionName, schema);
