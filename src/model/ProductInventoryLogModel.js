const { Schema, model } = require('mongoose');
const { InventoryLogType } = require('../lib/Enums');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'ProductInventoryLog';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  product: {
    type: String,
    ref: 'Product',
    index: true,
  },
  shift: {
    type: Number,
    index: true,
  },
  type: {
    type: String,
    enum: InventoryLogType.toList(),
    index: true,
  },
  tag: {
    type: String,
    index: true,
  },
  productAttribute: {
    type: String,
    ref: 'ProductAttribute',
    index: true,
  }
});

module.exports = new model(collectionName, schema);
