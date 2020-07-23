const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

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

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
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
    })
    .then(() => repository.user.findByPhone(args.data.phone))
    .then((user) => {
      if (!user) {
        throw new UserInputError('User does not exists');
      }
      return user;
    })
    .then((user) => (
      repository.verificationCode.deactivate(user.id)
        .then(() => new Promise((resolve, reject) => {
          nexmo.verify.request({
            number: args.data.phone.replace('+', ''),
            brand: 'Shoclef',
            code_length: '6',
          }, (err, result) => {
            if (err) return reject(err);
            return resolve({ id: result.request_id });
          });
        }))
        .catch((err) => {
          throw new ApolloError(err);
        })
        .then(() => true)
    ));
};
