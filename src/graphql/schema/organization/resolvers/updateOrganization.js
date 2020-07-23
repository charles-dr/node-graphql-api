const { UserInputError } = require('apollo-server');
const path = require('path');

// const logger = require(path.resolve('config/logger'));
const { providers: { EasyPost } } = require(path.resolve('src/bundles/delivery'));
const { ForbiddenError } = require('apollo-server');

const activity = {
  async verifyCarriers(ids, repository) {
    if (ids) {
      return Promise.all(ids.map((carrierId) => repository.carrier.getById(carrierId)
        .then((carrier) => {
          if (!carrier) {
            throw new UserInputError(`Carrier ${carrierId} does not exists`, { invalidArgs: 'carriers' });
          }

          return carrier;
        })));
    }
    return Promise.resolve(null);
  },
};

module.exports = async (obj, args, { user, dataSources: { repository } }) => activity.verifyCarriers(args.data.carriers, repository)
  .then(async (carriers) => {
    let address = null;
    let easyPostAddressId = null;
    let addressObj = null;
    // const billingAddressObj = null;

    if (args.data.address === undefined && (!args.data.carriers || args.data.carriers.length === 0 || args.data.carriers === '') && !args.data.customCarrier) {
      throw new UserInputError('You can not update organization without adding a custom carrier or carriers.');
    }

    let customCarrier;
    if (args.data.customCarrier) {
      customCarrier = await repository.customCarrier.findOrCreate({ name: args.data.customCarrier });

      if (!customCarrier) {
        throw new ForbiddenError(`Can not find customCarrier with "${args.data.customCarrier}" name`);
      }
    }

    if (args.data.address) {
      const addressCountry = await repository.country.getById(args.data.address.country);
      if (!addressCountry) {
        throw new UserInputError('Country does not exists', { invalidArgs: 'address' });
      }
      const addressRegion = await repository.region.getById(args.data.address.region);
      if (!addressRegion) {
        throw new UserInputError('Region does not exists', { invalidArgs: 'address' });
      }

      address = {
        ...args.data.address,
        region: addressRegion,
        country: addressCountry,
      };

      addressObj = {
        phone: user.phone,
        email: user.email,
        address: {
          street: address.street,
          description: address.description,
          city: address.city,
          region: address.region ? address.region._id : null,
          zipCode: address.zipCode,
          country: address.country._id,
        },
      };
      await EasyPost.addAddress(addressObj).then((res) => {
        easyPostAddressId = res.id;
        address.addressId = res.id;
      }).catch((error) => {
        throw new UserInputError(`Failed to update organization. Original error: ${error.message}`);
      });

      address.isDeliveryAvailable = true;
    }

    let billingAddress = null;
    if (args.data.billingAddress) {
      const billingAddressCountry = await repository.country.getById(args.data.billingAddress.country);
      if (!billingAddressCountry) {
        throw new UserInputError('Country does not exists', { invalidArgs: 'billingAddress' });
      }

      const billingAddressRegion = await repository.region.getById(args.data.billingAddress.region);
      if (!billingAddressRegion) {
        throw new UserInputError('Region does not exists', { invalidArgs: 'address' });
      }

      billingAddress = {
        ...args.data.billingAddress,
        region: billingAddressRegion,
        country: billingAddressCountry,
      };

      billingAddress.addressId = easyPostAddressId;
      billingAddress.isDeliveryAvailable = true;
    }
    return repository.organization.getByUser(user.id)
      .then((organization) => repository.organization.update(organization, {
        ...args.data,
        owner: user,
        address,
        billingAddress,
        carriers,
        customCarrier: customCarrier ? customCarrier.id : null,
      }))
      .then((newOrganization) => repository.user.updateOrganization(user.id, newOrganization)
        .then(() => newOrganization));
  });
