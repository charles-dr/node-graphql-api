const { Schema, model } = require('mongoose');
const createdAtField = require('./commonFields/CreatedAtField');

const schema = new Schema({
  ...createdAtField,

  tag: {
    type: String,
    required: true,
  },
  user: {
    type: String,
    ref: 'User',
    required: true,
  },
});

schema.index({ tag: 1, user: 1 }, { unique: true });

module.exports = new model('Like', schema);
