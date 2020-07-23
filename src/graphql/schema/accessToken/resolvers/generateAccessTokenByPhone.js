const path = require('path');
const { UserInputError } = require('apollo-server');
const { Validator } = require('node-input-validator');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

module.exports = async (obj, { data }, { dataSources: { repository } }) => {
  const validator = new Validator(data, {
    phone: 'required|phoneNumber',
    password: 'required|minLength:6',
  });

  return validator.check()
    .then((matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      return repository.user.findByPhoneAndPassword(data);
    })
    .then((user) => {
      if (user === null) {
        throw new UserInputError('Invalid login or password');
      }

      return repository.accessToken.create(user, {
        ip: data.ip || null,
        userAgent: data.userAgent || null,
      });
    });
};
