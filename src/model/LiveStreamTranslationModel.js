const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');


const collectionName = 'LiveStreamTranslation';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  livestream: {
    type: String,
    ref: 'LiveStream',
  },
  title: {
    type: Object,
  },
});

module.exports = new model(collectionName, schema);
