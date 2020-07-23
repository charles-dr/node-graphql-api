const path = require('path');
const { Validator } = require('node-input-validator');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { ApolloError } = require('apollo-server');

const errorHandler = new ErrorHandler();

module.exports = async (obj, { data }, { dataSources: { repository }, user }) => {
  const validator = new Validator(data, {
    language: 'required',
    currency: 'required',
    measureSystem: 'required',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.user.updateSettings(user.id, data))
    .then((updatedUser) => updatedUser.settings)
    .catch((error) => {
      throw new ApolloError(`Failed to update user settings. Original error: ${error.message}`, 400);
    });
};
