const { Schema, model } = require('mongoose');
const { Currency, PaymentTransactionStatus } = require('../lib/Enums');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'PaymentTransaction';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  status: {
    type: String,
    enum: PaymentTransactionStatus.toList(),
    required: true,
    default: PaymentTransactionStatus.PENDING,
    index: true,
  },
  merchant: {
    type: String,
    required: false,
  },
  signature: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    required: false,
  },
  buyer: {
    type: String,
    ref: 'User',
    index: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    enum: Currency.toList(),
    required: true,
  },
  processedAt: {
    type: Date,
  },
  tags: [{
    type: String,
    index: true,
  }],
  providerTransactionId: {
    type: String,
  },
  responsePayload: {
    type: Object,
  },
  paymentMethod: {
    type: String,
    ref: 'PaymentMethod',
  },
});

schema.methods.isSuccessful = function isSuccessful() {
  return this.status === PaymentTransactionStatus.SUCCESS;
};

module.exports = new model(collectionName, schema);
