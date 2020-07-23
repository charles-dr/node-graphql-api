const uuid = require('uuid/v4');
const path = require('path');
const { UserInputError, ApolloError } = require('apollo-server');
const { Validator } = require('node-input-validator');
const nev = require('node-email-validator');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { EmailService } = require(path.resolve('src/bundles/email'));
const { Geocoder } = require(path.resolve('src/lib/Geocoder'));
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository } }) => {
  const validator = new Validator(args.data, {
    email: 'required|email',
    phone: 'required',
    password: 'required|minLength:6|regex:^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])',
  });

  const validNumber = await phoneUtil.parse(args.data.phone);

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.user.findByEmail(args.data.email))
    .then((existingUser) => {
      if (existingUser) {
        throw new UserInputError('Email already taken', { invalidArgs: 'email' });
      }
    })
    .then(() => nev(args.data.email).then(validation => {
      const { isEmailValid } = validation
      if (!isEmailValid) {
        throw new UserInputError('Could not validate email.', { invalidArgs: 'email' });
      }
    })
    )
    .then(async () => {
      if (!phoneUtil.isValidNumberForRegion(validNumber, args.data.countryCode)) {
        if ((phoneUtil.getRegionCodeForNumber(validNumber) !== 'AR' && phoneUtil.getRegionCodeForNumber(validNumber) !== 'MX')
          || phoneUtil.getRegionCodeForNumber(validNumber) !== args.data.countryCode
          || !phoneUtil.isPossibleNumber(validNumber)) {
          throw new UserInputError('The phone number must be a valid phone number.', { invalidArgs: 'phone' });
        }
      }

      if (args.data.photo) {
        const asset = await repository.asset.load(args.data.photo);
        if (!asset) {
          throw new UserInputError(`Asset ${args.data.photo} does not exist`, { invalidArgs: 'photo' });
        }
      }

      let { location } = args.data;
      let address = null;
      let addressRegion;
      let tempCurrency;
      if (args.data.address) {
        const addressCountry = await repository.country.getById(args.data.address.country);
        if (!addressCountry) {
          throw new UserInputError('Country does not exists', { invalidArgs: 'address' });
        }
        if (args.data.address.region !== null && args.data.address.region !== undefined) {
          addressRegion = await repository.region.getById(args.data.address.region);
          if (!addressRegion) {
            throw new UserInputError('Region does not exists', { invalidArgs: 'address' });
          }
        }

        address = {
          ...args.data.address,
          region: addressRegion,
          country: addressCountry,
        };

        tempCurrency = addressCountry ? addressCountry.currency : 'USD';
      }

      let addressObj = {
        phone: args.data.phone,
        email: args.data.email,
      };

      try {
        if (location && !address) {
          address = await Geocoder.reverse(location);
          const geocodedCountry = await repository.country.getById(address.country.id);
          if (!geocodedCountry) {
            throw new UserInputError('Country does not exists', { invalidArgs: 'location' });
          }
          address.country = geocodedCountry.id;
          addressObj = {
            ...addressObj,
            address: {
              street: address.street,
              city: address.city,
              region: address.region ? address.region : null,
              zipCode: address.zipCode,
              country: address.country,
            },
          };
        } else if (address) {
          location = await Geocoder.geocode(address);
          addressObj = {
            ...addressObj,
            address: {
              street: args.data.address.street,
              description: args.data.address.description,
              city: args.data.address.city,
              region: args.data.address.region,
              zipCode: args.data.address.zipCode,
              country: args.data.address.country,
            },
          };
        } else {
          throw new ApolloError(`Please provide an address or location.`, 400);
        }
      } catch (error) {
        throw new ApolloError(`Failed to store the address. Original error: ${error.message}`, 400);
      }
      const tempCountry = await repository.country.getById(addressObj.address.country);

      return {
        _id: uuid(),
        email: args.data.email,
        phone: args.data.phone,
        isApprovedEmail: false,
        password: args.data.password,
        name: args.data.name,
        photo: args.data.photo,
        currency: tempCurrency || tempCountry.currency,
        language: args.data.language || 'ENG',
        location,
        address: {
          ...addressObj.address,
        },
      }
    })
    .then((newUser) => repository.user.createNewUser(newUser, { roles: ['USER'] }))
    .then(async (user) => {
      await repository.asset.updateOwner(user.photo, user.id)
        .catch((err) => {console.log(err.message)})
      EmailService.sendWelcome({ user });
      return user;
    });
};
