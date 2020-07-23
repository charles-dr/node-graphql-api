const { Schema, model } = require('mongoose');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'Region';

const schema = new Schema({
  _id: {
    type: String,
  },
  ...createdAtField,

  name: {
    type: String,
    required: true,
    index: true,
  },
  country: {
    type: String,
    ref: 'Country',
    index: true,
  },
});

module.exports = new model(collectionName, schema);
