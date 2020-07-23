const path = require('path');
const uuid = require('uuid/v4');
const { UserInputError } = require('apollo-server');
const { Validator } = require('node-input-validator');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

const activity = {
  getAnonymousAccount: async (anonymousId, repository) => repository.user.findByAnonymousId(anonymousId)
    .then(async (user) => {
      if (user) return user;
      const email = await activity.generateEmail(repository);
      const password = activity.randString(6);
      return repository.user.create({
        _id: uuid(),
        email,
        password,
      }, { roles: ['USER'] })
        .then((user) => {
          user.name = user.email.split('@')[0];
          user.isAnonymous = true;
          user.anonymousId = anonymousId;
          return user.save();
        });
    }),
  generateEmail: async (repository) => {
    const prefix = activity.randString(3);
    const time = Date.now();
    const email = `${prefix}_${time}@tempmail.com`;
    return repository.user.findByEmail(email)
      .then((user) => {
        if (user) return activity.generateEmail(repository);
        return email;
      });
  },
  randString: (length) => {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  },
};

module.exports = async (_, { data }, { dataSources: { repository } }) => {
  const validator = new Validator(data, {
    anonymousId: 'required',
  });

  const { anonymousId } = data;

  return validator.check()
    .then((matched) => {
      if (!matched) throw errorHandler.build(validator.errors);
      return activity.getAnonymousAccount(anonymousId, repository);
    })
    .then((user) => repository.accessToken.create(user, {
      ip: data.ip || null,
      userAgent: data.userAgent || null,
    }));
};
