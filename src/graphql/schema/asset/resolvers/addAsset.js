const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const { ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { cdn } = require(path.resolve('config'));
const MIMEAssetTypes = require(path.resolve('src/lib/MIMEAssetTypes'));

const errorHandler = new ErrorHandler();

module.exports = async (_, { data }, { user, dataSources: { repository } }) => {
  const validator = new Validator(data, {
    mimetype: 'required',
    size: 'required',
  });

  validator.addPostRule(async (input) => {
    if (!MIMEAssetTypes.detect(input.inputs.mimetype)) {
      validator.addError('mimetype', 'custom', 'API does not support this mimetype');
    }
  });

  return validator.check()
    .then((matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      const { mimetype, size } = data;
      const { ext, type } = MIMEAssetTypes.detect(mimetype);
      const id = uuid();
      const path = `${user.id}/${id}.${ext}`;
      const url = `${cdn.userAssets}/${path}`;

      const assetData = {
        _id: id,
        owner: user,
        path,
        url: url,
        type,
        size,
        mimetype,
      };

      return repository.asset
        .create(assetData)
        .catch((error) => {
          throw new ApolloError(`Failed to add Asset. Original error: ${error.message}`, 400);
        });
    });
};
