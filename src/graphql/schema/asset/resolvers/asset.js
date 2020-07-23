const path = require('path');
const { Validator } = require('node-input-validator');
const { ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

module.exports = async (_, args, { dataSources: { repository } }) => {
  const validator = new Validator(args, {
    id: 'required',
  });

  return validator.check()
    .then((matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      return repository.asset
        .load(args.id)
        .catch((error) => {
          throw new ApolloError(`Failed to load Asset "${args.id}". Original error: ${error.message}`, 400);
        });
    });
};
