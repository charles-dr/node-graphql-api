const path = require('path');
const { Validator } = require('node-input-validator');

const { UserInputError, ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(args, {
    product: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.product.getById(args.product))
    .then(async (product) => {
      if (!product) {
        throw new UserInputError('Product does not exists', { invalidArgs: 'product' });
      }
      const tag = product.getTagName();
      const review = await repository.rating.create({
        tag,
        user: user.id,
        rating: args.rating,
        product: args.product,
        media: args.media,
        message: args.message,
      });
      return review;
    })
    .catch((error) => {
      throw new ApolloError(`Failed to rate Product. Original error: ${error.message}`, 400);
    });
};
