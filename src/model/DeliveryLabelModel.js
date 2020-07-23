const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'DeliveryLabel';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  label_id: {
    type: String,
    required: true,
  },
  shipment_id: {
    type: String,
    required: true,
  },
  carrier_id: {
    type: String,
    required: true,
  },
  service_code: {
    type: String,
    required: true,
  },
  label_download: {
    type: Object,
    required: true,
  },
});

schema.methods.getTagName = function getTagName() {
  return `${collectionName}:${this._id}`;
};

module.exports = new model(collectionName, schema);
