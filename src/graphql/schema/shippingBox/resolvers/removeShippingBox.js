const path = require('path');
const { Validator } = require('node-input-validator');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { ForbiddenError, UserInputError, ApolloError } = require('apollo-server');

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(args, {
    id: 'required',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.shippingBox.findOne(args.id))
    .then((shippingBox) => {
      if (!shippingBox) {
        throw new UserInputError('Shipping box does not exists', { invalidArgs: ['id'] });
      }

      if (user.id !== shippingBox.owner) {
        throw new ForbiddenError('You can not remove this shipping box', 400);
      }

      return shippingBox;
    })
    .then((shippingBox) => repository.product.isShippingBoxInUse(shippingBox.id))
    .then((isShippingBoxUse) => {
      if (isShippingBoxUse) {
        throw new UserInputError('Shipping box uses in products, you can not remove it', { invalidArgs: ['id'] });
      }
    })
    .then(() => repository.shippingBox.remove(args.id))
    .then(() => true)
    .catch((error) => {
      if (!(error instanceof UserInputError || error instanceof ForbiddenError)) {
        throw new ApolloError(`Failed to remove Shipping Box. Original error: ${error.message}`, 400);
      }
      throw error;
    });
};
