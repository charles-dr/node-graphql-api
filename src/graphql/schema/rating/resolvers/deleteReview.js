const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

module.exports = async (_, { id }, { dataSources: { repository }, user }) => {
  const validator = new Validator({ id }, {
    id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
  })

  validator.addPostRule(provider => repository.rating.getById(id)
    .then(review => {
      if (!review) provider.error('id', 'custom', `Review with id "${id}" does not exist!`);
      else if (review.user !== user.id) provider.error('permission', 'custom', 'You have no permission to delete this review!');
    }))

  return validator.check()
    .then(async (matched) => {
      if (!matched) throw errorHandler.build(validator.errors);
      return repository.rating.delete(id);
    })
    .then((result) => {
      return result.deletedCount === 1;
    })
    .catch((error) => {
      throw new ApolloError(`Failed to update Product. Original error: ${error.message}`, 400);
    })
}
