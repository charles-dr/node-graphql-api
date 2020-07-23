const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'DeliveryEstimateRate';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  seller: {
    type: Object,
    required: true,
  },
  buyer: {
    type: Object,
    required: true,
  },
  shipFrom: {
    type: Object,
    required: true,
  },
  shipTo: {
    type: Object,
    required: true,
  },
  product: {
    type: Object,
    required: true,
  },
  package: {
    type: Object,
    required: true,
  },
  deliveryInfo: {
    type: Object,
    required: true,
  },
});

schema.methods.getTagName = function getTagName() {
  return `${collectionName}:${this._id}`;
};

module.exports = new model(collectionName, schema);
