const path = require('path');
const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const { DiscountValueType, DiscountPrivileges } = require(path.resolve('src/lib/Enums'));

const collectionName = 'Discount';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  user: {
    type: String,
    ref: 'User',
    index: true,
  },
  code: {
    type: String,
    required: true,
  },
  value_type: {
    type: String,
    enum: DiscountValueType.toList(),
    required: true,
  },
  products: [{
    type: String,
    ref: 'Product',
    index: true,
  }],
  product_categories: [{
    type: String,
    ref: 'ProductCategory',
    index: true,
  }],
  all_product: {
    type: Boolean,
    default: false,
  },
  brands: [{
    type: String,
    ref: 'Brand',
    index: true,
  }],
  brand_categories: [{
    type: String,
    ref: 'BrandCategory',
    index: true,
  }],
  amount: {
    type: Number,
    required: true,
  },
  privilege: {
    type: String,
    enum: DiscountPrivileges.toList(),
    required: true,
  },
  startAt: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  endAt: {
    type: Date,
    required: true,
  },
});

module.exports = new model(collectionName, schema);
