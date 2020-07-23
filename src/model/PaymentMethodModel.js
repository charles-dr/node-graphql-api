const path = require('path');
const { Schema, model, Mixed } = require('mongoose');

const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const collectionName = 'PaymentMethod';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  isActive: {
    type: Boolean,
    required: true,
    default: true,
    index: true,
  },
  isDeleted: {
    type: Boolean,
    required: true,
    default: false,
    index: true,
  },
  user: {
    type: String,
    required: true,
    ref: 'User',
    index: true,
  },
  provider: {
    type: String,
    required: true,
    index: true,
  },
  providerIdentity: {
    type: String,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  expiredAt: {
    type: Date,
    index: true,
  },
  data: {
    type: Mixed,
  },
  usedAt: {
    type: Date,
    required: true,
    default: new Date(),
  },
  card: {
    type: String,
    required: true,
  },
});

schema.indexes([
  { user: 1, isActive: 1, usedAt: -1 }, // Standard query for fetching active payment methods
]);

module.exports = new model(collectionName, schema);
