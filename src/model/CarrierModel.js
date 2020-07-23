const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'Carrier';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: false,
  },
  phone: {
    type: String,
    required: false,
  },
  homepage: {
    type: String,
    default: '', // courier website link
    required: false,
  },
  apiProvider: {
    type: String,
    default: 'EasyPost',
    required: true,
  },
  carrierId: String, // EasyPost carrier account id // tracktry.com couriers_code
  workInCountries: [{
    type: String,
    ref: 'Country',
  }],
});

module.exports = new model(collectionName, schema);
