const { Schema } = require('mongoose');

const addressSchema = new Schema({
  addressId: {
    type: String,
    required: false,
  },
  street: String,
  city: String,
  region: {
    type: String,
    ref: 'Region',
  },
  country: {
    type: String,
    ref: 'Country',
  },
  zipCode: String,
  phone: String,
  isDeliveryAvailable: {
    type: Boolean,
    default: false,
  },
  description: String,
}, { _id: false });

module.exports = addressSchema;
