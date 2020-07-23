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

module.exports = async (obj, args, { dataSources: { repository } }) => {
  const validator = new Validator(args.data, {
    phone: 'required|phoneNumber',
    countryCode: 'required',
  });

  const validNumber = await phoneUtil.parse(args.data.phone);

  await validator.check()
    .then(async (matched) => {
      if (!matched) {
        console.log(matched);
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.user.findByPhone(args.data.phone))
    .then((existingUser) => {
      if (existingUser) {
        throw new UserInputError('Phone number already taken.', { invalidArgs: 'phone' });
      }
    })
    .then(() => {
      if (!phoneUtil.isValidNumberForRegion(validNumber, args.data.countryCode)) {
        if ((phoneUtil.getRegionCodeForNumber(validNumber) !== 'AR' && phoneUtil.getRegionCodeForNumber(validNumber) !== 'MX')
                    || phoneUtil.getRegionCodeForNumber(validNumber) !== args.data.countryCode
                    || !phoneUtil.isPossibleNumber(validNumber)) {
          throw new UserInputError('The phone number must be a valid phone number.', { invalidArgs: 'phone' });
        }
      }
    });

  return new Promise((resolve, reject) => {
    nexmo.verify.request({
      number: args.data.phone.replace('+', ''),
      brand: 'Shoclef',
      code_length: '6',
    }, (err, result) => {
      console.log('result =>', result);
      if (err) reject(err);
      resolve({ id: result.request_id });
    });
  });
};
