const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { providers: { EasyPost } } = require(path.resolve('src/bundles/delivery'));

const errorHandler = new ErrorHandler();

module.exports = async (_, { id, data }, { dataSources: { repository }, user }) => {
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
      return EasyPost.updateAddress({ address: data });
    })
    .then((response) => repository.deliveryAddress.update({
      id,
      savedAddressId: response.id,
      ...data,
    }))
    .then((shippingAddressItem) => {
      return repository.billingAddress.findByShippingAddress(shippingAddressItem.id).then((billingAddresses) => {
        if (billingAddresses && billingAddresses.length > 0) {
          return Promise.all(billingAddresses.map((billingAddress) => repository.billingAddress.update({
            id: billingAddress.id,
            shipping: true,
            savedAddressId: shippingAddressItem.address.addressId,
            shippingAddress: shippingAddressItem.id,
            label: shippingAddressItem.label,
            street: shippingAddressItem.address.street,
            city: shippingAddressItem.address.city,
            region: shippingAddressItem.address.region,
            country: shippingAddressItem.address.country,
            zipCode: shippingAddressItem.address.zipCode,
          })))
        }
      }).then(() => {
        // check default status
        if (data.isDefault) return repository.deliveryAddress.setAsDefault(id, user.id)
      }).then(() => shippingAddressItem)
    })
    .catch((error) => {
      throw new ApolloError(`Failed to Update Delivery Address. Original error: ${error.message}`, 400);
    });
};
