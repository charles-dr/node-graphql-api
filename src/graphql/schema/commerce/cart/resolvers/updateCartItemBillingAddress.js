const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

module.exports = async (_, { ids, billingAddress }, { dataSources: { repository }, user }) => {
  const validator = new Validator({ ids, billingAddress }, {
    ids: "required",
    billingAddress: "required",
  });

  return validator.check()
    .then((matched) => {
      if (!matched) throw errorHandler.build(validator.errors);
      return Promise.all([
        repository.userCartItem.getAll({ _id: { $in: ids } }),
        repository.billingAddress.getById(billingAddress),
      ]);
    })
    .then(([cartItems, billingAddress_]) => {
      // validate
      if (cartItems.length < ids.length) {
        const invalidArgs = ids.filter(id => !cartItems.map(item => item.id).includes(id));
        throw new UserInputError('Not found the cart items!', { invalidArgs });
      }
      // check ownership
      const notOwned = cartItems.filter(cartItem => cartItem.user !== user.id).map(item => item.id);
      if (notOwned.length) {
        throw new UserInputError('Permission Error!', { invalidArgs: notOwned });
      }
      if (!billingAddress) {
        throw new UserInputError(`Not found the billing address with id "${billingAddress}"`, { invalidArgs: [ billingAddress ]});
      }
      return Promise.all(cartItems.map(cartItem => {
        cartItem.billingAddress = billingAddress;
        return cartItem.save();
      }));
    });
}
