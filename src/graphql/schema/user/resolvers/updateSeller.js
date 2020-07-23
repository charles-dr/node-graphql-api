const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { Geocoder } = require(path.resolve('src/lib/Geocoder'));
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository } }) => {

  const validator = new Validator(args.data, {
    id: 'required',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.user.getById(args.data.id))
    .then(async (user) => {
      if (!user) {
        throw new UserInputError('Seller ID is wrong');
      }
      const userInput = args.data;
      let location = null;
      let address = null;

      if (userInput.email) {
        await repository.user.findByEmail(userInput.email)
          .then((res) => {
            if (res) {
              throw new UserInputError('This email is already used')
            }
          })
          .catch((err) => {
            throw new Error(err.message);
          });
      }

      if (userInput.phone || userInput.countryCode) {
        const phone = userInput.phone ? userInput.phone : user.phone;
        const countryCode = userInput.countryCode ? userInput.countryCode : user.address.country;

        const validNumber = await phoneUtil.parse(phone);
        if (!phoneUtil.isValidNumberForRegion(validNumber, countryCode)) {
          if ((phoneUtil.getRegionCodeForNumber(validNumber) !== 'AR' && phoneUtil.getRegionCodeForNumber(validNumber) !== 'MX')
            || phoneUtil.getRegionCodeForNumber(validNumber) !== countryCode
            || !phoneUtil.isPossibleNumber(validNumber)) {
            throw new UserInputError('Please provide the valid phone number');
          }
        }
      }

      if (userInput.address) {
        const addressCountry = await repository.country.getById(userInput.address.country);

        if (!addressCountry) {
          throw new UserInputError('Please valid country');
        }

        if (userInput.address.region !== null && userInput.address.region !== undefined) {
          await repository.region.getById(userInput.address.region)
            .then((addressRegion) => {
              if (!addressRegion) {
                throw new UserInputError('Please select valid region')
              }
            })
            .catch((error) => {
              throw new Error(error.message);
            });
        } else {
          throw new UserInputError('Please select region');
        }

        location = await Geocoder.geocode(userInput.address);
        address = userInput.address;
      }

      if (userInput.location) {
        await Geocoder.reverse(userInput.location)
          .then(async (addressRef) => {
            if (!addressRef) {
              throw new UserInputError('Please provide the valid location');
            }

            await repository.country.getById(addressRef.country.id)
              .then((country) => {
                if (!country) {
                  throw new UserInputError('Please provide the valid location');
                }
              })
              .then(() => {
                address = {
                  country: addressRef.country.id,
                  street: addressRef.street,
                  city: addressRef.city,
                  region: addressRef.region ? addressRef.region : null,
                  zipCode: addressRef.zipCode,
                };
                location = userInput.location;
              })
              .catch((error) => {
                throw new Error(error.message);
              });
          });
      }

      return repository.user.update(userInput.id, {
        ...userInput,
        address,
        location,
      })
        .catch((error) => {
          throw new Error(error.message);
        });
    });
};
