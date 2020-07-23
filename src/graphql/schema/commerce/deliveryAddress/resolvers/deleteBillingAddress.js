const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ForbiddenError, ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

module.exports = async (_, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(args, {
    id: 'required',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      return repository.billingAddress.getById(args.id);
    })
    .then((billingAddress) => {
      if (!billingAddress) {
        throw new UserInputError('Delivery Address does not exists', { invalidArgs: 'id' });
      }

      if (billingAddress.owner !== user.id) {
        throw new ForbiddenError('You can not delete this Delivery Address');
      }

      return repository.billingAddress.delete(args.id);
    })
    .then(() => true)
    .catch((error) => {
      throw new ApolloError(`Failed to delete Delivery Address. Original error: ${error.message}`, 400);
    });
};
