const { Schema, model } = require('mongoose');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const collectionName = 'VerificationCode';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  user: {
    type: String,
    ref: 'User',
    default:"for_signup",
    required: true,
  },
  code: String,
  isActive: {
    type: Boolean,
    default: true,
  },
});

module.exports = new model(collectionName, schema);
