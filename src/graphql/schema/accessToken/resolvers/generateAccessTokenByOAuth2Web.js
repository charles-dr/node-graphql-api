const uuid = require('uuid/v4');
const path = require('path');
const { UserInputError } = require('apollo-server');
const { Validator } = require('node-input-validator');
const logger = require('../../../../../config/logger');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { OAuth2Service } = require(path.resolve('src/lib/OAuth2Service'));

const errorHandler = new ErrorHandler();

module.exports = async (obj, { data }, { dataSources: { repository } }) => {
  const validator = new Validator(data, {
    provider: 'required',
    token: 'required',
  });

  return validator.check()
    .then((matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      const provider = OAuth2Service.getStrategy(data.provider);
      return provider.getUserProfile(data.token);
    })
    .then((socialUserData) => {
      if (socialUserData === null) {
        throw new UserInputError(`User not found by ${data.provider} provider`);
      }

      logger.debug(JSON.stringify(socialUserData));

      return repository.user.findByProvider(data.provider, socialUserData.id)
        .then((user) => {
          if (!user) {
            throw new UserInputError(`User does not exist. Please sign up now.`);
          }

          return user;
        });
    })
    .then((user) => repository.accessToken.create(user));
};
