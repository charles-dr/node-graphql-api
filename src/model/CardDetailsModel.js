const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'CardDetails';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  number: {
    type: String,
    required: true,
  },
  exp_month: {
    type: Number,
    required: true,
  },
  exp_year: {
    type: Number,
    required: true,
  },
  cvc: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: null
  },
  providerID: {
    type:String,
    required: true
  }
});

module.exports = new model(collectionName, schema);
