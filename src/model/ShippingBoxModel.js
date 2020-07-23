const path = require('path');
const { Schema, model } = require('mongoose');

const { SizeUnitSystem, WeightUnitSystem } = require(path.resolve('src/lib/Enums'));
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'ShippingBox';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  parcelId: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
    ref: 'User',
    required: true,
  },
  width: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  length: {
    type: Number,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    default: 'INCH',
    enum: SizeUnitSystem.toList(),
  },
  unitWeight: {
    type: String,
    enum: WeightUnitSystem.toList(),
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
});

module.exports = new model(collectionName, schema);
