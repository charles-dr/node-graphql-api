const { Schema, model } = require('mongoose');
const path = require('path');

const { SourceType } = require(path.resolve('src/lib/Enums'));
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const collectionName = 'StreamSource';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  user: {
    type: String,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: SourceType.toList(),
  },
  source: String,
  prerecorded:Boolean
});

module.exports = new model(collectionName, schema);
