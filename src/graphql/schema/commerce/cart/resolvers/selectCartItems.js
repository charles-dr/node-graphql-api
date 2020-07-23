const path = require('path');
const { Validator } = require('node-input-validator');
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { UserInputError, ApolloError, ForbiddenError } = require('apollo-server');

const errorHandler = new ErrorHandler();
const loadCart = require('./loadCart');

module.exports = async (_, { ids, selected = true }, { dataSources: { repository }, user }) => {
  const validator = new Validator({ ids }, {
    ids: "required"
  });

  validator.addPostRule(async provider => {
    const invalidIds = [];
    await Promise.all(provider.inputs.ids.map(itemId => repository.userCartItem.getById(itemId)
      .then(cartItem => {
        if (!cartItem) invalidIds.push(itemId);
      })));
    if (invalidIds.length) {
      throw new UserInputError("Cart items not found!", { invalidArgs: invalidIds })
    }
  });

  return validator.check()
    .then(matched => {
      if (!matched) throw errorHandler.build(validator.errors);
      return repository.userCartItem.getAll({ user: user.id, _id: { $in: ids } });
    })
    .then(cartItems => {
      return Promise.all(cartItems.map(cartItem => {
        cartItem.selected = selected;
        return cartItem.save();
      }))
    })
    .then(() => loadCart({}, {}, { dataSources: { repository }, user}));
}