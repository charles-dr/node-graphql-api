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

      if (args.data.photo) {
        const asset = await repository.asset.load(args.data.photo);
        if (!asset) {
          throw new UserInputError(`Asset ${args.data.photo} does not exist`, { invalidArgs: 'photo' });
        }
      }

      const { location } = args.data;
      // let address = null;
      // let addressRegion;
      // let tempCurrency;
      // if (args.data.address) {
      //   const addressCountry = await repository.country.getById(args.data.address.country);
      //   if (!addressCountry) {
      //     throw new UserInputError('Country does not exists', { invalidArgs: 'address' });
      //   }
      //   if (args.data.address.region !== null & args.data.address.region !== undefined) {
      //     addressRegion = await repository.region.getById(args.data.address.region);
      //     if (!addressRegion) {
      //       throw new UserInputError('Region does not exists', { invalidArgs: 'address' });
      //     }
      //   }

      //   address = {
      //     ...args.data.address,
      //     region: addressRegion,
      //     country: addressCountry,
      //   };

      //   tempCurrency = addressCountry ? addressCountry.currency : 'USD';
      //   await repository.user.updateCurrency(user.id, tempCurrency);
      // }

      // let addressObj = {
      //   phone: args.data.phone,
      //   email: args.data.email,
      // };
      // try {
      //   if (location && !address) {
      //     address = await Geocoder.reverse(location);
      //     const geocodedCountry = await repository.country.getById(address.country.id);
      //     if (!geocodedCountry) {
      //       throw new UserInputError('Country does not exists', { invalidArgs: 'location' });
      //     }
      //     address.country = geocodedCountry.id;
      //     addressObj = {
      //       ...addressObj,
      //       address: {
      //         street: address.street,
      //         city: address.city,
      //         region: address.region ? address.region : null,
      //         zipCode: address.zipCode,
      //         country: address.country,
      //       },
      //     };
      //   } else if (address) {
      //     location = await Geocoder.geocode(address);
      //     addressObj = {
      //       ...addressObj,
      //       address: {
      //         street: args.data.address.street,
      //         description: args.data.address.description,
      //         city: args.data.address.city,
      //         region: args.data.address.region,
      //         zipCode: args.data.address.zipCode,
      //         country: args.data.address.country,
      //       },
      //     };
      //   }
      //   else {
      //     // throw new ApolloError(`Please provide an address or location.`, 400);
      //   }
      // } catch (error) {
      //   throw new ApolloError(`Failed to store the address. Original error: ${error.message}`, 400);
      // }

      // const countryCode = (addressObj.address ? addressObj.address.country : userObj.address.country).toUpperCase()
      // const tempCountry = await repository.country.getById(countryCode);
      // await repository.user.updateCurrency(user.id, tempCountry.currency);
      const updateData = { };
      console.log('updateUser', args);
      args.data.name ? updateData.name = args.data.name : null;
      args.data.nick_name ? updateData.nick_name = args.data.nick_name : null;
      args.data.country ? updateData.country = args.data.country : null;
      args.data.hometown ? updateData.hometown = args.data.hometown : null;
      args.data.email ? updateData.email = args.data.email : null;
      args.data.phone ? updateData.phone = args.data.phone : null;
      args.data.photo ? updateData.photo = args.data.photo : null;
      location ? updateData.location = location : null;
      // addressObj.address ? updateData.address = addressObj.address : null;
      args.data.gender ? updateData.gender = args.data.gender : null;
      args.data.color ? updateData.color = args.data.color : null;

      return repository.user.update(user.id, updateData).catch((error) => {
        throw new ApolloError(`Failed to update user. Original error: ${error.message}`, 400);
      });
    });
};
