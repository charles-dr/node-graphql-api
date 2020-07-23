const path = require('path');
const { Schema, model } = require('mongoose');

const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');
const { IssueStatus, IssueUrgency } = require('../lib/Enums');

const collectionName = 'Issue';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  issuer: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  urgency: {
    type: String,
    enum: IssueUrgency.toList(),
    required: true,
    index: true,
    default: IssueUrgency.NORMAL,
  },
  message: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    ref: "IssueCategory",
  },
  attachments: [{
    type: String,
    ref: 'Asset'
  }],
  note: String,
  status: {
    type: String,
    enum: IssueStatus.toList(),
    default: IssueStatus.CREATED,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

module.exports = new model(collectionName, schema);