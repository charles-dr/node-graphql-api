const path = require('path');
const { Schema, model } = require('mongoose');

const { LoginProvider, GenderType } = require(path.resolve('src/lib/Enums'));
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');
const LatitudeLongitudeSchema = require('./LatitudeLongitudeModel');
const AddressSchema = require('./AddressModel');
const UserSettingsSchema = require('./UserSettingsModel');

const collectionName = 'User';

const providerObject = {};

LoginProvider.toList().forEach((provider) => {
  providerObject[provider] = {
    type: String,
    required: false,
  };
});

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  email: {
    type: String,
    // unique: true,
    sparse: true,
    required: false,
    index: true,
    get: (email) => (!email || email.split('@')[1] === 'tempmail.tmp' ? null : email),
  },
  password: {
    type: String,
    required: false,
  },
  phone: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: false,
  },
  country: {
    type: String,
    required: false,
  },
  hometown: {
    type: String,
    required: false,
  },
  nick_name: {
    type: String,
    required: false,
  },
  photo: {
    type: String,
    ref: 'Asset',
  },
  address: {
    type: AddressSchema,
    required: false,
  },
  location: {
    type: LatitudeLongitudeSchema,
    required: false,
  },
  roles: {
    type: [String],
  },
  isApprovedEmail: {
    type: Boolean,
    default: false,
  },
  settings: {
    type: UserSettingsSchema,
    required: true,
  },
  providers: {
    type: providerObject,
    default: {},
  },
  blackList: {
    type: [{
      type: String,
      ref: 'User',
    }],
    default: [],
  },
  isOnline: {
    type: Boolean,
    required: false,
  },
  // for push notification from onesignal
  device_id: {
    type: String,
    default: '',
  },
  organization: {
    type: String,
    ref: 'Organization',
  },
  fee: {
    type: Number,
    default: 0.2,
  },
  color: {
    type: {
      background: String,
      text: String,
    },
    default: {
      background: "#779ecb",
      text: "#6e6a6c",
    }
  },
  gender: {
    type: String,
    enum: GenderType.toList(),
    default: GenderType.toList()[0],
  },
  following: [{
    type: String,
    default: [],
    index: true,
  }],
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  anonymousId: {
    type: String,
  },
});

schema.methods.getTagName = function getTagName() {
  return `${collectionName}:${this._id}`;
};

module.exports = new model(collectionName, schema);
