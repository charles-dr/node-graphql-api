const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'))
const errorHandler = new ErrorHandler();

module.exports = async (_, { id, deliveryRate }, { dataSources: { repository }, user }) => {
  const validator = new Validator({ id, deliveryRate}, {
    id: "required",
    deliveryRate: "required",
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) throw errorHandler.build(validator.errors);
      return Promise.all([
        repository.userCartItem.getById(id),
        repository.deliveryRateCache.getById(deliveryRate),
      ]);
    })
    .then(([userCartItem, deliveryRateCache]) => {
      if (!userCartItem) {
        throw new UserInputError(`Cart item with id "${id}" does not exist!`, { invalidArgs: [id] });
      }
      if (!deliveryRateCache) {
        throw new UserInputError(`Delivery rate with id "${deliveryRate}" does not exist!`, { invalidArgs: [deliveryRate] });
      }

      userCartItem.deliveryRate = deliveryRate;
      return repository.deliveryRate.getById(deliveryRate).then(deliveryRate_ => {
        if (!deliveryRate_) {
          return  repository.deliveryRate.create(deliveryRateCache.toObject());
        }
      })
      .then(() => userCartItem.save())
    });
}
