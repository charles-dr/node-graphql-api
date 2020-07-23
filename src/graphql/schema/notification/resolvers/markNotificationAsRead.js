const path = require('path');
const { Validator } = require('node-input-validator');

const { ApolloError, UserInputError, ForbiddenError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

module.exports = (_, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(args,
    { id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']] });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      return repository.notification.findOne(args.id);
    })
    .then((notification) => {
      if (!notification) {
        throw new UserInputError(`Notification ${args.id} does not exist`, { invalidArgs: 'id' });
      }

      if (notification.user !== user.id) {
        throw new ForbiddenError('You can not read this notification');
      }

      return notification.markRead();
    })
    .catch((error) => {
      throw new ApolloError(`Failed to read Notification. Original error: ${error.message}`, 400);
    });
};
