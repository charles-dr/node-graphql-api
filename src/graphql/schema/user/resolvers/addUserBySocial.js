const uuid = require('uuid/v4');
const path = require('path');
const { UserInputError } = require('apollo-server');
const { Validator } = require('node-input-validator');
const md5 = require('md5');

const logger = require('../../../../../config/logger');
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { OAuth2Service } = require(path.resolve('src/lib/OAuth2Service'));
const { EmailService } = require(path.resolve('src/bundles/email'));

const errorHandler = new ErrorHandler();

const activity = {
  createUser: async (args, repository) => {
    const { photo, name, provider, providerId, email, anonymousId } = args;
    const anonymousUser = anonymousId ? await repository.user.findByAnonymousId(anonymousId) : null;
    if (anonymousUser) {
      if (email) {
        const userByEmail = await repository.user.findByEmail(email);
        if (userByEmail) throw Error(`Email "${email}" is already taken!`);
        anonymousUser.email = email;
      }
      anonymousUser.isAnonymous = false;
      anonymousUser.anonymousId = null;
      anonymousUser.photo = photo;
      anonymousUser.name = name;
      anonymousUser.providers = { [provider]: providerId }
      return anonymousUser.save();
    }
    repository.user.createByProvider(args, { roles: ['USER'] })
  },
}

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
          if (user) {
            throw new UserInputError(`${data.provider} user already exists`);
          }
          if (socialUserData.email) {
            user = repository.user.findByEmail(socialUserData.email);
            if (!user || Object.keys(user) === 0) {
              throw new UserInputError(`Email already taken ${socialUserData.email}`);
            }
          }

          return data.anonymousId ? repository.user.findByAnonymousId(data.anonymousId) : null;
        })
        .then((anonymousUser) => {
          const userId = anonymousUser ? anonymousUser.id : uuid();
          return repository.asset.createFromUri({
            userId,
            url: socialUserData.photo,
          })
            .then((asset) => activity.createUser({
              _id: userId,
              email: socialUserData.email,
              name: socialUserData.name,
              photo: asset,
              provider: data.provider,
              providerId: socialUserData.id,
            }, repository))
            .then((user) => {
              if (socialUserData.email) {
                EmailService.sendWelcome({ user });
              }
              return user;
            });
        });
    });
};
