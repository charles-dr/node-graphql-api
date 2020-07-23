const { Schema, model } = require('mongoose');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const collectionName = 'AccessToken';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  user: {
    type: String,
    ref: 'User',
  },
  secret: {
    type: String,
    required: true,
  },
  ip: {
    type: String,
    required: false,
  },
  fingerprint: {
    type: String,
    required: false,
  },
});

module.exports = new model(collectionName, schema);
