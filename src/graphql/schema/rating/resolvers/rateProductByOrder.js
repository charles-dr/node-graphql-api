const path = require('path');
const uuid = require("uuid/v4");
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { OrderItemStatus } = require(path.resolve('src/lib/Enums'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const PythonService = require(path.resolve('src/lib/PythonService'));
const ratingMethods = require('../ratingMethods');
const errorHandler = new ErrorHandler();


module.exports = async (_, { data }, { dataSources: { repository }, user }) => {
  const validator = new Validator(data, {
    product: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
    order: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
  });

  validator.addPostRule(provider => Promise.all([
    repository.product.getById(data.product),
    repository.orderItem.getById(data.order),
    repository.purchaseOrder.getOne({ items: data.order }),
  ])
    .then(([product, orderItem, purchaseOrder]) => {
      if (!product) provider.error('product', 'custom', `Product with id "${data.product}" does not exist!`);

      if(!orderItem) provider.error('order', 'custom', `Order item with id "${data.order}" does not exist!`);
      else if (orderItem.product !== data.product) {
        provider.error('order', 'custom', 'Product and order do not match!');
      } else if ([OrderItemStatus.CREATED, OrderItemStatus.CANCELED].includes(orderItem.status)) {
        provider.error('order', 'custom', 'The order is pending or canceled!')
      }

      if (!purchaseOrder) provider.error('purchaseOrder', 'custom', 'Purchase order does not exist for the given order!');
      else if (purchaseOrder.buyer !== user.id) {
        provider.error('buyer', 'custom', 'You can only rate the product you bought in the past!');
      }

      if (product) {
        return repository.rating.load(product.getTagName(), user.id);
      }
    })
    .then(review => {
      if (review) {
        provider.error('review', 'custom', 'You already rated this product!');
      }
    })
  )

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
      return repository.product.getById(data.product);
    })
    .then(async (product) => {
      const lang = ratingMethods.reduceLangRange(await PythonService.detectLanguage(data.message));

      return repository.rating.create({
        _id: uuid(),
        tag: product.getTagName(),
        user: user.id,
        rating: data.rating,
        message: data.message,
        order: data.order,
        lang,
      });
    })
    .catch((error) => {
      throw new ApolloError(`Failed to rate Product. Original error: ${error.message}`, 400);
    });
};
