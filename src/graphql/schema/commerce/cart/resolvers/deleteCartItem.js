const path = require('path');
const uuid = require('uuid/v4');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError, ForbiddenError } = require('apollo-server');
const { InventoryLogType } = require(path.resolve('src/lib/Enums'));
const ProductService = require(path.resolve('src/lib/ProductService'));

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(
    args,
    { id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']] },
  );

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.userCartItem.getById(args.id))
    .then(async (userCartItem) => {
      if (!userCartItem) {
        throw new UserInputError(`Cart item (${args.id}) does not exist`, { invalidArgs: 'id' });
      }

      if (userCartItem.user !== user.id) {
        throw new ForbiddenError('You can not delete this Cart Item');
      }

      const productInfo = userCartItem.productAttribute ? 
        await repository.productAttributes.getById(userCartItem.productAttribute) : 
        await repository.product.getById(userCartItem.product);
      productInfo.quantity += userCartItem.quantity;
      await productInfo.save();

      const inventoryLog = {
        _id: uuid(),
        product: userCartItem.product,
        productAttribute: userCartItem.productAttribute,
        type: InventoryLogType.BUYER_CART,
        shift: userCartItem.quantity,
      };
      await Promise.all([
        ProductService.setProductQuantityFromAttributes(userCartItem.product),
        repository.productInventoryLog.add(inventoryLog),
      ])

      return repository.userCartItem.delete(args.id);
    })
    .catch((error) => {
      throw new ApolloError(`Failed to delete Cart Item. Original error: ${error.message}`, 400);
    });
};
