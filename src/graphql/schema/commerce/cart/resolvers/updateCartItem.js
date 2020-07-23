const path = require('path');
const { Validator } = require('node-input-validator');
const uuid = require('uuid/v4');
const { UserInputError, ApolloError, ForbiddenError } = require('apollo-server');
const { InventoryLogType } = require(path.resolve('src/lib/Enums'));
const ProductService = require(path.resolve('src/lib/ProductService'));

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(
    args,
    { id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']] },
    { billingAddress: ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}'] },
    { quantity: 'required|min:1|integer' },
  );

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => Promise.all([
      repository.userCartItem.getById(args.id),
      repository.deliveryRateCache.getById(args.deliveryRate),
    ]))
    .then(async ([userCartItem, deliveryRate]) => {
      if (!userCartItem) {
        throw new UserInputError(`Cart item (${args.id}) does not exist`, { invalidArgs: 'id' });
      }

      const productInfo = userCartItem.productAttribute
        ? await repository.productAttributes.getById(userCartItem.productAttribute)
        : await repository.product.getById(userCartItem.product);

      if (productInfo.quantity + userCartItem.quantity - args.quantity < 0) {
        throw new ForbiddenError('This product is not enough now');
      }

      productInfo.quantity = productInfo.quantity + userCartItem.quantity - args.quantity;
      const cartItemData = {
        quantity: args.quantity,
        note: args.note,
      };
      if (args.billingAddress) {
        cartItemData.billingAddress = args.billingAddress;
      }

      if (deliveryRate) {
        cartItemData.deliveryRateId = deliveryRate.id;
      }
      return repository.deliveryRate.getById(deliveryRate ? deliveryRate.id : userCartItem.deliveryRate)
        .then(async (saveDeliveryRate) => {
          await productInfo.save();

          if (args.quantity - userCartItem.quantity !== 0) {
            const inventoryLog = {
              _id: uuid(),
              product: userCartItem.product,
              productAttribute: userCartItem.productAttribute,
              type: InventoryLogType.BUYER_CART,
              shift: userCartItem.quantity - args.quantity,
            };
            await Promise.all([
              ProductService.setProductQuantityFromAttributes(userCartItem.product),
              repository.productInventoryLog.add(inventoryLog),
            ]);                    
          }
          console.log({saveDeliveryRate, cartItemData});
          if (saveDeliveryRate) {
            cartItemData.deliveryRateId = saveDeliveryRate.id;
            return repository.userCartItem.update(args.id, cartItemData);
          }
          if (deliveryRate) {
            return repository.deliveryRate.create(deliveryRate.toObject())
            .then(() => repository.userCartItem.update(args.id, cartItemData));
          } else {
            return repository.userCartItem.update(args.id, cartItemData);
          }          
        });
    })
    .catch((error) => {
      throw new ApolloError(`Failed to update Cart Item. Original error: ${error.message}`, 400);
    });
};
