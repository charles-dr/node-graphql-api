const path = require('path');
const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const { Currency } = require(path.resolve('src/lib/Enums'));
const { easyPost } = require(path.resolve('config'));
const collectionName = 'DeliveryRateCache';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  shipmentId: {   // shipment id from EasyPost calculated rates
    type: String,
    required: false,
  },
  service: String,    // service name for EasyPost carrier
  deliveryDateGuaranteed: Boolean,    // a boolean from EasyPost that it indicates if delivery window is guaranteed (true) or not (false)
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
schema.index({ createdAt: 1 }, { expires: easyPost.deliveryRateCacheTTL });

module.exports = new model(collectionName, schema);
