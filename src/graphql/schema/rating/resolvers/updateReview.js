const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const PythonService = require(path.resolve('src/lib/PythonService'));
const ratingMethods = require('../ratingMethods');
const errorHandler = new ErrorHandler();


module.exports = async (_, { id, data }, { dataSources: { repository }, user }) => {
  const validator = new Validator({ id, ...data }, {
    id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
  });

  validator.addPostRule(provider => Promise.all([
    repository.rating.getById(provider.inputs.id),
  ])
    .then(([review]) => {
      if (!review) provider.error('id', 'custom', `Review with id "${id}" does not exist!`);
      else if (review.user !== user.id) provider.error('user', 'custom', "You have no permission to update this review!");
    })
  )

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
      return repository.rating.getById(id);
    })
    .then(async (review) => {
      review.message = data.message || review.message;
      review.rating = data.rating !== undefined && typeof data.rating === 'number' ? data.rating : review.rating;
      review.lang = ratingMethods.reduceLangRange(await PythonService.detectLanguage(review.message));
      return review.save();
    })
    .catch((error) => {
      throw new ApolloError(`Failed to update Product. Original error: ${error.message}`, 400);
    });
};
