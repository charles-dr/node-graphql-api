const path = require('path');
const uuid = require("uuid/v4");
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();
const PythonService = require(path.resolve('src/lib/PythonService'));
const ratingMethods = require('../ratingMethods');

module.exports = async (_, { data }, { dataSources: { repository }, user }) => {
  const validator = new Validator(data, {
    user: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
  })

  let userToRate;
  validator.addPostRule(provider => Promise.all([
    repository.user.getById(provider.inputs.user)
  ])
    .then(([userById]) => {
      if (!userById) provider.error('user', 'custom', `User with id "${provider.inputs.user}" does not exist!`);
      else if (!user.following.includes(userById.getTagName())) {
        provider.error('user', 'custom', 'You can rate the user after following!');
      }
      userToRate = userById;
    }))

  return validator.check()
    .then(async (matched) => {
      if (!matched) throw errorHandler.build(validator.errors);
    })
    .then(async () => {
      const lang = ratingMethods.reduceLangRange(await PythonService.detectLanguage(data.message));
      return repository.rating.create({
        _id: uuid(),
        tag: userToRate.getTagName(),
        user: user.id,
        rating: data.rating,
        message: data.message,
        lang,
      });
    })
    .catch((error) => {
      throw new ApolloError(`Failed to rate user. Original error: ${error.message}`, 400);
    })
}
