const path = require('path');
const { Validator } = require('node-input-validator');

const ProductService = require(path.resolve('src/lib/ProductService'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { UserInputError, ApolloError, ForbiddenError } = require('apollo-server');

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(
    args,
    { product: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']] },
    { quantity: 'required|min:1|integer' },
    { billingAddress: 'required' },
  );
  
  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => Promise.all([
      repository.product.getById(args.product),
      args.deliveryRate ? repository.deliveryRateCache.getById(args.deliveryRate) : null,
      args.productAttribute ? repository.productAttributes.getById(args.productAttribute) : null,
    ]))
    .then(async ([product, deliveryRate, productAttr]) => {
      if (!product) {
        throw new UserInputError(`Product with id "${args.product}" does not exist!`, { invalidArgs: [args.product] });
      }
      if (args.productAttribute && !productAttr) {
        throw new UserInputError('Product attribute does not exist.', { invalidArgs: [args.productAttribute]});
      }
      if (product.wholesaleEnabled) {
        if (!args.metricUnit) {
          throw new UserInputError(`Product with id "${args.product}" is for wholesale!`, { invalidArgs: [product] })
        } else {
          let [selectedItem] = product.metrics.filter(metricItem => metricItem.metricUnit === args.metricUnit);
          if (!selectedItem) {
            throw new UserInputError(`Product with id "${args.product}" doesn't have metric unit ${args.metricUnit}!`, { invalidArgs: [product] })
          } else {
            if (args.quantity < selectedItem.minCount) {
              throw new UserInputError(`Product with id "${args.product}" should be added at least ${selectedItem.minCount} ${args.metricUnit}(s)`, { invalidArgs: [ product ] });
            }
          }
        }
      }

      const checkAmount = await ProductService.checkProductQuantityAvailable(args, repository);

      if (!checkAmount) { throw new ForbiddenError('This product is not enough now'); }

      // Biwu's past work
      const cartItemData = {
        productId: product.id,
        quantity: args.quantity,
        productAttribute: args.productAttribute,
        billingAddress: args.billingAddress,
        metricUnit: args.metricUnit || null,
        note: args.note,
      };
      
      // delivery rate is optional. but null at this stage, must be added on the checkout.
      if (args.deliveryRate) {
        if (!deliveryRate) { throw new ForbiddenError('Delivery Rate does not exist'); }
        cartItemData.deliveryRateId = deliveryRate.id;
        await repository.deliveryRate.getById(deliveryRate.id)
          .then(async response => {
            if (!response) {
              await repository.deliveryRate.create(deliveryRate.toObject());
            }
          });
      }
      
      return Promise.all([
        ProductService.decreaseProductQuantity(args, repository),
        ProductService.setProductQuantityFromAttributes(args.product),
      ])
        .then(() => repository.userCartItem.add(cartItemData, user.id))
    })
    .catch((error) => { console.log(error);
      throw new ApolloError(`Failed to add Product to Cart. Original error: ${error.message}`, 400);
    });
};
