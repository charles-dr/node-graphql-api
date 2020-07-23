const { Schema, model } = require('mongoose');

const schema = new Schema({
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  leavedAt: {
    type: Date,
    default: null,
  },
  token: String,
  user: {
    type: String,
    ref: 'User',
  },
  channel: {
    type: String,
    ref: 'StreamChannel',
    required: true,
  },
  isPublisher: Boolean,
});

module.exports = new model('StreamChannelParticipant', schema);
