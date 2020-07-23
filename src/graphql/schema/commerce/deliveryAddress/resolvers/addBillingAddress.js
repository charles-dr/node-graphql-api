const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { providers: { EasyPost } } = require(path.resolve('src/bundles/delivery'));

const errorHandler = new ErrorHandler();

module.exports = async (_, { data }, { dataSources: { repository }, user }) => {
  if (data.shippingAddress) {
    if (data.shippingAddress.length > 0 && data.shippingAddress.search('[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}') === 0) {
      return repository.deliveryAddress.getById(data.shippingAddress)
        .then((address) => {
          if (!address) { throw new ApolloError('Failed to add Billing Address. Original error: No Shipping Address', 400); }
          return repository.billingAddress.addAddress(address);
        })
        .catch((error) => {
          throw new ApolloError(`Failed to add Billing Address. Original error: ${error.message}`, 400);
        });
    }
  } else {
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

        return EasyPost.addAddress({ phone: user.phone, email: user.email, address: data })
          .then((response) => repository.billingAddress.create({
            region,
            owner: user.id,
            addressId: response.id,
            ...data,
          })).catch((error) => {
            throw new ApolloError(`Failed to create Billing Address. Original error: ${error.message}`, 400);
          });
      })
      .catch((error) => {
        throw new ApolloError(`Failed to add Billing Address. Original error: ${error.message}`, 400);
      });
  }
};
