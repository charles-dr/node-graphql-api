const uuid = require('uuid/v4');
const path = require('path');
const { UserInputError } = require('apollo-server');
const { Validator } = require('node-input-validator');
const nev = require('node-email-validator');
const md5 = require('md5');

const { EmailService } = require(path.resolve('src/bundles/email'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

const activity = {
  createUser: async (args, repository) => {
    const { email, password, anonymousId } = args;
    const anonymousUser = anonymousId ? await repository.user.findByAnonymousId(anonymousId) : null;
    if (anonymousUser) {
      anonymousUser.isAnonymous = false;
      anonymousUser.anonymousId = null;
      anonymousUser.email = email.toLowerCase();
      anonymousUser.password = md5(password);
      return anonymousUser.save();
    }
    return repository.user.create({
      _id: uuid(),
      email,
      password,
    }, { roles: ['USER'] });
  },
};

module.exports = async (obj, args, { dataSources: { repository } }) => {
  const validator = new Validator(args.data, {
    email: 'required|email',
    // password: 'required|minLength:6|regex:^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.user.findByEmail(args.data.email))
    .then((existingUser) => {
      if (existingUser) {
        throw new UserInputError('Email already taken', { invalidArgs: 'email' });
      }
    })
    .then(() => nev(args.data.email).then(validation => {
      const { isEmailValid } = validation
      if (!isEmailValid) {
        throw new UserInputError('Could not validate email.', { invalidArgs: 'email' });
      }
    })
    )
    .then(() => activity.createUser(args.data, repository))
    .then((user) => {
      EmailService.sendWelcome({ user });
      return user;
    });
};
