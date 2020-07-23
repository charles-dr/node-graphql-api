const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { providers: { EasyPost } } = require(path.resolve('src/bundles/delivery'));

const errorHandler = new ErrorHandler();

module.exports = async (_, { data }, { dataSources: { repository }, user }) => {
  const validator = new Validator(data, {
    label: 'required',
    street: 'required',
    city: 'required',
    region: 'required',
    country: 'required',
    // zipCode: 'required',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      return Promise.all([
        repository.country.getById(data.country),
        repository.region.getById(data.region),
      ]);
    })
    .then(([country, region]) => {
      if (!country) {
        throw new UserInputError('Country does not exists', { invalidArgs: 'country' });
      }

      if (!region) {
        throw new UserInputError('Region does not exists', { invalidArgs: 'region' });
      }
      return EasyPost.addAddress({ phone: user.phone, email: user.email, address: data }).then(response => repository.deliveryAddress.create({
        region,
        owner: user.id,
        addressId: response.id,
        ...data,
      })).catch((error) => {
        throw new ApolloError(`Failed to create Delivery Address. Original error: ${error.message}`, 400);
      });
    })
    .catch((error) => {
      throw new ApolloError(`Failed to add Delivery Address. Original error: ${error.message}`, 400);
    });
};
