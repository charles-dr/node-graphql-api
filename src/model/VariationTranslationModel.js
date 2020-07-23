const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');


const collectionName = 'VariationTranslation';


const TranslationSchema = new Schema({
  name: String,
  value: Object,
}, { _id: false });

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  attribute: {
    type: String,
    ref: 'Product',
  },
  variations: [TranslationSchema],
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

module.exports = new model(collectionName, schema);
