const uuid = require('uuid/v4');
const path = require('path');
const { UserInputError } = require('apollo-server');
const { Validator } = require('node-input-validator');
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const md5 = require('md5');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

const activity = {
  createUser: async (args, repository) => {
    const {
      phone, countryCode, password, anonymousId,
    } = args;
    const anonymousUser = anonymousId ? await repository.user.findByAnonymousId(anonymousId) : null;
    if (anonymousUser) {
      anonymousUser.isAnonymous = false;
      anonymousUser.anonymousId = null;
      anonymousUser.phone = phone;
      anonymousUser.countryCode = countryCode;
      anonymousUser.password = md5(password);
      anonymousUser.address = { countryCode };
      return anonymousUser.save();
    }
    return repository.user.createByPhone({
      _id: uuid(),
      phone,
      countryCode,
      password,
    }, { roles: ['USER'] });
  },
};

module.exports = async (obj, args, { dataSources: { repository } }) => {
  const validator = new Validator(args.data, {
    phone: 'required|phoneNumber',
    countryCode: 'required',
    password: 'required|minLength:6|regex:^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])',
  });

  const validNumber = await phoneUtil.parse(args.data.phone);

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
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
    })
    .then(() => activity.createUser(args.data, repository))
    .then((user) => user);
};
