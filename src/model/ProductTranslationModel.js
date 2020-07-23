const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');


const collectionName = 'ProductTranslation';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  product: {
    type: String,
    ref: 'Product',
  },
  title: {
    type: Object,
  },
  description: {
    type: Object,
  },
});

module.exports = new model(collectionName, schema);
