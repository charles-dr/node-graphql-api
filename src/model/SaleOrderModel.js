const { Schema, model } = require('mongoose');
const { Currency, SaleOrderStatus } = require('../lib/Enums');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'SaleOrder';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  seller: {
    type: String,
    ref: 'User',
    required: true,
    index: true,
  },
  buyer: {
    type: String,
    ref: 'User',
    required: true,
    index: true,
  },
  deliveryOrders: [{
    type: String,
    ref: 'DeliveryOrder',
  }],
  items: [{
    type: String,
    ref: 'OrderItem',
    required: true,
  }],
  quantity: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    enum: Currency.toList(),
  },
  total: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: SaleOrderStatus.toList(),
    default: SaleOrderStatus.CREATED,
  },
  purchaseOrder: {
    type: String,
    ref: 'PurchaseOrder',
  },
  packingslip: [{
    type: String,
    default: null,
  }],
});

schema.methods.getTagName = function getTagName() {
  return `SaleOrder:${this._id}`;
};

module.exports = new model(collectionName, schema);
