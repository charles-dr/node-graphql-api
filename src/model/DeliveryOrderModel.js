const { Schema, model } = require('mongoose');
const { DeliveryOrderStatus, Currency } = require('../lib/Enums');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'DeliveryOrder';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  seller: {
    type: String,
    ref: 'User',
    required: true,
    index: true,
  },
  item: {
    type: String,
    ref: 'OrderItem',
    required: true,
  },
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
  deliveryAddressInfo: {
    type: Object,
  },
  trackingNumber: {
    type: String,
    index: true,
  },
  rate_id: {
    type: String,
    index: true,
  },
  status: {
    type: String,
    required: true,
    enum: DeliveryOrderStatus.toList(),
    default: DeliveryOrderStatus.CREATED,
  },
  estimatedDeliveryDate: {
    type: Date,
  },
  currency: {
    type: String,
    enum: Currency.toList(),
  },
  deliveryPrice: {
    type: Number,
    required: true,
  },
  proofPhoto: {
    type: String,
    ref: 'Asset',
  },
  carrierList: {
    type: Array,
    default: [],
  },
});

schema.methods.getTagName = function getTagName() {
  return `${collectionName}:${this._id}`;
};

module.exports = new model(collectionName, schema);
