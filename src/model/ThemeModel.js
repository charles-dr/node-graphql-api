const path = require('path');
const { Schema, model } = require('mongoose');

const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');
const { ThemeType } = require('../lib/Enums');

const collectionName = 'Theme';


const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  name: {
    type: String,
    required: true,
    unique: true,
  },
  order: {
    type: Number,
    default: 1000,
  },
  thumbnail: {
    type: String,
    ref: 'Asset',
    required: true,
  },
  hashtags: {
    type: [{
      type: String,
    }],
    default: [],
    index: true,
  },
  productCategories: {
    type: [{
      type: String,
      ref: 'ProductCategory',
    }],
    default: [],
  },
  brandCategories: {
    type: [{
      type: String,
      ref: 'BrandCategory',
    }],
    default: [],
  },
  brands: {
    type: [{
      type: String,
      ref: 'Brand',
    }],
    default: [],
  },
  liveStreams: {
    type: [{
      type: String,
      ref: 'LiveStream',
    }],
    default: [],
  },
  liveStreamCategories: {
    type: [{
      type: String,
      ref: 'LiveStreamCategory',
    }],
    default: [],
  },
  type: {
    type: String,
    enum: ThemeType.toList(),
  },
  start_time: {
    type: Date,
    default: Date.now,
  },
  end_time: {
    type: Date,
    default: Date.now,
  },
  featureProduct: {
    type: String,
    ref: "Product",
  },
});

module.exports = new model(collectionName, schema);