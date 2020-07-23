const path = require('path');
const { Schema, model } = require('mongoose');

const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const collectionName = 'IssueCategory';


const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  name: {
    type: String,
    required: true,
    unique: true,
  },
  notifyEmails: {
    type: [{ type: String }],
    default: [],
  },
});

module.exports = new model(collectionName, schema);