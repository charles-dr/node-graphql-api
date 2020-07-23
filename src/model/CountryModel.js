const { Schema, model } = require('mongoose');
const { Currency } = require('../lib/Enums');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'Country';

const schema = new Schema({
  _id: {
    type: String,
  },
  ...createdAtField,

  name: {
    type: String,
    required: true,
  },
  geonameId: {
    type: String,
    required: false,
  },
  currency: {
    type: String,
    enum: Currency.toList(),
  },
});

module.exports = new model(collectionName, schema);
