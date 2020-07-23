const { Schema, model } = require('mongoose');
const { Currency } = require('../lib/Enums');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'SortPriceRate';

const schema = new Schema({
  _id: {
    type: String,
    enum: Currency.toList(),
  },
  ...createdAtField,

  rate: {
    type: Number,
    required: true,
  },
  code: {
    type: String,
    enum: Currency.toList(),
  },
});

module.exports = new model(collectionName, schema);
