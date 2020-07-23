const uuid = require('uuid/v4');
const path = require('path');
const { UserInputError } = require('apollo-server');
const { Validator } = require('node-input-validator');

const { nexmoConfig } = require(path.resolve('config'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

const errorHandler = new ErrorHandler();
const Nexmo = require('nexmo');

const nexmo = new Nexmo({
  apiKey: nexmoConfig.apiKey,
  apiSecret: nexmoConfig.apiSecret,
});

const verifyResponseCode = {
  3: 'INVALID_REQUEST_ID',
  16: 'INVALID_CODE',
  6: 'NOT_FOUND_OR_ALREADY_VERIFIED',
};

module.exports = async (obj, args, { dataSources: { repository } }) => {
  const validator = new Validator(args.data, {
    code: 'required',
    request_id: 'required',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(async () => new Promise((resolve, reject) => {
      nexmo.verify.check({
        request_id: args.data.request_id,
        code: args.data.code,
      }, (err, result) => {
        if (result.status != 0) {
          let message = result.error_text.replace('Nexmo', 'Shoclef');
          message = message.replace(`Request '${args.data.request_id}'`, 'Your request');
          resolve({
            result: false,
            message,
            code: verifyResponseCode[result.status],
          });
        } else {
          resolve({
            result: true,
            message: '',
            code: 'SUCCESS',
          });
        }
      });
    }));
};
