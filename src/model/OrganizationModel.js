const { Schema, model } = require('mongoose');
const path = require('path');
const AddressSchema = require('./AddressModel');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const { MarketType } = require(path.resolve('src/lib/Enums'));

const collectionName = 'Organization';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  owner: {
    type: String,
    ref: 'User',
  },
  name: String,
  type: String,
  address: {
    type: AddressSchema,
    required: false,
  },
  billingAddress: {
    type: AddressSchema,
    required: false,
  },
  payoutInfo: String,
  returnPolicy: String,
  carriers: [{
    type: String,
    ref: 'Carrier',
  }],
  customCarrier: {
    type: String,
    ref: 'CustomCarrier',
  },
  workInMarketTypes: [{
    type: String,
    enum: MarketType.toList(),
    index: true,
  }],
});

schema.methods.getTagName = function getTagName() {
  return `${collectionName}:${this._id}`;
};

module.exports = new model(collectionName, schema);
