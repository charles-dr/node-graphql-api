const path = require('path');
const { Validator } = require('node-input-validator');

const { UserInputError, ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(args, {
    organization: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.organization.getById(args.organization))
    .then((organization) => {
      if (!organization) {
        throw new UserInputError('Organization does not exists', { invalidArgs: 'organization' });
      }
      return repository.rating.create({
        tag: organization.getTagName(),
        user: user.id,
        rating: args.rating,
        message: args.message,
      });
    })
    .then(() => true)
    .catch((error) => {
      throw new ApolloError(`Failed to rate Organization. Original error: ${error.message}`, 400);
    });
};
