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

module.exports = async (obj, args, { dataSources: { repository } }) => {
  const updatedUsers = [];
  await Promise.all(args.data.map(async (user) => {
    let error = false;

    if (!error) {
      if (user.photo) {
        const asset = await repository.asset.load(user.photo);
        if (!asset) {
          error = true;
        }
      }

      let { location } = user;
      let address = null;
      let addressRegion;

      if (!error && user.address) {
        const addressCountry = await repository.country.getById(user.address.country);
        if (!addressCountry) {
          error = true;
        }
        if (user.address.region !== null && user.address.region !== undefined) {
          addressRegion = await repository.region.getById(user.address.region);
          if (!addressRegion) {
            error = true;
          }
        }

        address = {
          ...user.address,
          region: addressRegion,
          country: addressCountry,
        };
      }

      let addressObj = {
        phone: user.phone,
        email: user.email,
      };

      if (!error) {
        try {
          if (location && !address) {
            address = await Geocoder.reverse(location);
            const geocodedCountry = await repository.country.getById(address.country.id);
            if (!geocodedCountry) {
              error = true;
            }
            if (!error) {
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
            }
          } else if (address) {
            location = await Geocoder.geocode(address);
            addressObj = {
              ...addressObj,
              address: {
                street: user.address.street,
                description: user.address.description,
                city: user.address.city,
                region: user.address.region,
                zipCode: user.address.zipCode,
                country: user.address.country,
              },
            };
          }
        } catch (err) {
          error = true;
        }
      }

      if (!error) {
        await repository.user.update(user.id, {
          name: user.name,
          email: user.email,
          phone: user.phone,
          photo: user.photo,
          currency: user.currency,
          language: user.language,
          location,
          address: {
            ...addressObj.address,
          },
        })
          .then((result) => {
            console.log('Updated User: ', result);
          })
          .catch((err) => {
            error = true;
          });
      }
    }
    await repository.user.getById(user.id)
      .then((res) => (updatedUsers.push(res)));
  }));

  return updatedUsers;
};
