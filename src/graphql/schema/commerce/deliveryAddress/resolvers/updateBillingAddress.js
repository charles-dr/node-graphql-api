const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { providers: { EasyPost } } = require(path.resolve('src/bundles/delivery'));

const errorHandler = new ErrorHandler();

module.exports = async (_, { id, data }, { dataSources: { repository }, user }) => {
  if (data.shippingAddress) {
    const validate = new Validator({ ...data, id }, {
      id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
      shippingAddress: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
    });

    return validate.check()
      .then(async (matched) => {
        if (!matched) {
          throw errorHandler.build(validate.errors);
        }

        return repository.deliveryAddress.getById(data.shippingAddress)
          .then((response) => repository.billingAddress.update({
            id,
            shipping: true,
            savedAddressId: response.address.addressId,
            shippingAddress: response.id,
            label: response.label,
            street: response.address.street,
            city: response.address.city,
            region: response.address.region,
            country: response.address.country,
            zipCode: response.address.zipCode,
          })).catch((error) => {
            throw new ApolloError(`Failed to update Billing Address. Original error: ${error.message}`, 400);
          });
      });
  }
  const validator = new Validator({ ...data, id }, {
    id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
    addressId: 'required',
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
      return EasyPost.updateAddress({ address: data }).then((response) => repository.billingAddress.update({
        id,
        shipping: false,
        savedAddressId: response.id,
        ...data,
      })).catch((error) => {
        throw new ApolloError(`Failed to update Billing Address. Original error: ${error.message}`, 400);
      });
    })
    .catch((error) => {
      throw new ApolloError(`Failed to update Billing Address. Original error: ${error.message}`, 400);
    });
};
