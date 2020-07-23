const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError, ForbiddenError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { providers: { ShipEngine } } = require(path.resolve('src/bundles/delivery'));

const errorHandler = new ErrorHandler();

module.exports = async (_, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(args, {
    product: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
    deliveryAddress: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      return Promise.all([
        repository.product.getById(args.product),
        repository.deliveryAddress.getById(args.deliveryAddress),
      ]);
    })
    .then(([product, deliveryAddress]) => {
      if (!product) {
        throw new UserInputError('Product does not exists', { invalidArgs: 'product' });
      }

      if (!deliveryAddress) {
        throw new UserInputError('Delivery Address does not exists', { invalidArgs: 'deliveryAddress' });
      }

      if (!deliveryAddress.address.isDeliveryAvailable) {
        throw new UserInputError('Delivery Address is not valid for deliverance', { invalidArgs: 'deliveryAddress' });
      }

      return repository.organization.getByUser(product.seller)
        .then((organization) => {
          if (!organization) {
            throw new UserInputError('Product has no proper seller', { invalidArgs: 'product' });
          }

          if (!organization.address.isDeliveryAvailable) {
            throw new UserInputError('Product is not valid for deliverance', { invalidArgs: 'product' });
          }

          if (organization.carriers.length === 0) {
            throw new UserInputError('There is no carriers for you Delivery Address', { invalidArgs: 'deliveryAddress' });
          }

          return repository.carrier.loadList(organization.carriers)
            .then((carriers) => ShipEngine.oldCalculate(carriers, organization.address, deliveryAddress.address, product.weight)
              .then((rates) => {
                if (rates.length === 0) {
                  return { others: [], cheaper: null, faster: null };
                }
                const cheaper = rates.reduce((cheaperRate, rate) => (cheaperRate && rate.totalAmount >= cheaperRate.totalAmount ? cheaperRate : rate));
                const faster = rates.reduce((fasterRate, rate) => (fasterRate && rate.estimatedDeliveryDate >= fasterRate.estimatedDeliveryDate ? fasterRate : rate));
                const others = rates.filter((rate) => rate !== cheaper && rate !== faster);
                return { others, cheaper, faster };
              }));
        });
    })
    .catch((error) => {
      throw new ApolloError(`Failed to calculate delivery. Original error: ${error.message}`, 400);
    });
};
