const { Schema, model } = require('mongoose');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const collectionName = 'UserCartItem';
const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  user: {
    type: String,
    ref: 'User',
    required: true,
    index: true,
  },
  product: {
    type: String,
    ref: 'Product',
  },
  deliveryRate: {
    type: String,
    ref: 'DeliveryRate',
  },
  discount: {
    type: String,
    ref: 'Discount',
  },
  quantity: {
    type: Number,
    default: 1,
  },
  metricUnit: {
    type: String,
    // enum: ProductMetricUnits.toList(), // fields can be null for normal cart item
  },
  billingAddress: {
    type: String,
    default: null,
  },
  productAttribute: {
    type: String,
    ref: 'ProductAttribute',
  },
  note: {
    type: String,
    default: null,
  },
  selected: {
    type: Boolean,
    default: true,
  },
});

// eslint-disable-next-line new-cap
module.exports = new model(collectionName, schema);
