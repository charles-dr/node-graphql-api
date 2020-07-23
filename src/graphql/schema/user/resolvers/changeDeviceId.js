const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(args, {
    deviceId: 'required',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.user.getById(user._id))
    .then((existingUser) => {
      if (!existingUser) {
        throw new UserInputError('User does not exists');
      }
      return existingUser;
    })
    .then(async (user) => {
      if (args.deviceId) {
        var user = await repository.user.changeDeviceId(user._id, args.deviceId);
        return true;
      } else 
        return false;
    });
};
