const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { Geocoder } = require(path.resolve('src/lib/Geocoder'));
const repository = require(path.resolve('src/repository'));
const { providers: { EasyPost } } = require(path.resolve('src/bundles/delivery'));
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const fs = require('fs');

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(args.data, {
    email: 'email',
  });

  let validNumber;
  if (args.data.phone) {
    validNumber = await phoneUtil.parse(args.data.phone);
  }
  if (args.data.phone && !phoneUtil.isValidNumberForRegion(validNumber, args.data.countryCode)) {
    if ((phoneUtil.getRegionCodeForNumber(validNumber) !== 'AR' && phoneUtil.getRegionCodeForNumber(validNumber) !== 'MX')
      || phoneUtil.getRegionCodeForNumber(validNumber) !== args.data.countryCode
      || !phoneUtil.isPossibleNumber(validNumber)) {
      throw new UserInputError('The phone number must be a valid phone number.', { invalidArgs: 'phone' });
    }

    await repository.user.findByPhone(args.data.phone)
      .then((existingUser) => {
        if (existingUser && existingUser.id !== user.id) {
          throw new UserInputError('Phone number already taken.', { invalidArgs: 'phone' });
        }
      });
  }

  let userObj;

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
      /**
       * Use case when user is registered with Facebook provider with phone number and not an email
       */
      try {
        userObj = await repository.user.getById(user._id);
        if (!userObj.email) {
          if (args.data.email) {
            const checkEmail = await repository.user.findByEmail(args.data.email);
            if (checkEmail) {
              throw new Error('Email already taken');
            }
          }
          // else {
          //   throw new Error('Email should be provided');
          // }
        }
      } catch (ex) {
        throw new UserInputError(ex.message, { invalidArgs: 'email' });
      }
      const updateData = { };
      console.log('updateUser', args);
      args.data.email ? updateData.email = args.data.email : null;
      args.data.phone ? updateData.phone = args.data.phone : null;
      args.data.address ? updateData.address = args.data.address : null;
      return repository.user.update(user.id, updateData).catch((error) => {
        throw new ApolloError(`Failed to update user. Original error: ${error.message}`, 400);
      });
    });
};
