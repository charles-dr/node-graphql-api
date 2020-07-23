const path = require('path');
const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const { Currency } = require(path.resolve('src/lib/Enums'));
const collectionName = 'DeliveryRate';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  carrier: {
    type: String,
    ref: 'Carrier',
    required: false,
    index: true,
  },
  deliveryAddress: {
    type: String,
    ref: 'DeliveryAddress',
    required: true,
  },
  rate_id: {
    type: String,
    required: false,
  },
  deliveryDays: {
    type: Number,
    index: true,
  },
  estimatedDeliveryDate: Date,
  carrierDeliveryDays: String,
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    enum: Currency.toList(),
  },
});

module.exports = new model(collectionName, schema);
