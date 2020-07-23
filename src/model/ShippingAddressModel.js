const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'ShippingAddress';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  region: [{
    type: String,
    required: true,
  }],
  street: [{
    type: String,
    required: true,
  }],
  label: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
    ref: 'user',
  },
  isDeliveryAvailable: {
    type: Boolean,
    required: false,
    default: false
  },
  isDeleted: {
    type: Boolean,
    required: false,
    default: false
  },
  isDefault: {
    type: Boolean,
    required: false
  }
});

/* schema.methods.getTagName = function getTagName() {
  return `ShippingAddress:${this._id}`;
}; */

module.exports = new model(collectionName, schema);
