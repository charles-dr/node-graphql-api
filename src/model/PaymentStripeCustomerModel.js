const { Schema, model } = require('mongoose');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const collectionName = 'PaymentStripeCustomer';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  user: {
    type: String,
    ref: 'User',
    index: true,
    // unique: true,
  },
  customerId: {
    type: String,
    required: true,
    index: true,
  },
  ip: {
    type: String,
    required: false,
  },
  paymentMethods: [{
    type: String,
    ref: 'PaymentMethod',
    index: true,
  }],
  provider: {
    type: String,
    required: true,
    index: true,
  },
});

module.exports = new model(collectionName, schema);
