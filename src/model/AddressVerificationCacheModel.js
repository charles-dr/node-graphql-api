const path = require('path');
const { Schema, model } = require('mongoose');
const createdAtField = require('./commonFields/CreatedAtField');
const AddressSchema = require('./AddressModel');

const { shipengine } = require(path.resolve('config'));
const collectionName = 'AddressVerificationCache';

const schema = new Schema({
  ...createdAtField,

  address: {
    type: AddressSchema,
    required: true,
  },
  messages: {
    type: [String],
    default: [],
  },
  verified: {
    type: Boolean,
    default: true,
    index: true,
  },
});
schema.index({ createdAt: 1 }, { expires: shipengine.addressCacheTTL });

module.exports = new model(collectionName, schema);
