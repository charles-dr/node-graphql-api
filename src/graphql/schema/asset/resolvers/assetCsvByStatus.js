const path = require('path');
const { Validator } = require('node-input-validator');
const { ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

module.exports = async (_, args, { user, dataSources: { repository } }) => {
  const validator = new Validator(args, {
    status: 'required',
  });

  return validator.check()
    .then((matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      return repository.asset
        .getCsvAssetByStatus(args.status, user.id)
        .catch((error) => {
          throw new ApolloError(`Failed to load Asset by status: "${args.status}". Original error: ${error.message}`, 400);
        });
    });
};
