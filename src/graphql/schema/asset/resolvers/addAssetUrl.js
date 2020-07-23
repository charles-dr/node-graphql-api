const uuid = require('uuid/v4');
const path = require('path');
const url = require('url');
const { Validator } = require('node-input-validator');
const { ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { cdn } = require(path.resolve('config'));
const MIMEAssetTypes = require(path.resolve('src/lib/MIMEAssetTypes'));

const errorHandler = new ErrorHandler();

module.exports = async (_, { data }, { user, dataSources: { repository } }) => {
  const validator = new Validator(data, {
    path: 'required'
  });

  return validator.check()
    .then((matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      let { path, mimetype, filename } = data;
      const id = uuid();
      let pathname = url.parse(path).pathname;
      const { ext, type } = MIMEAssetTypes.detect(data.mimetype || 'image/jpeg');
      path = path.split(' ').join('%20');

      const assetData = {
        _id: id,
        owner: user,
        path: pathname + id,
        url: path,
        type: type,
        size: 100,
        mimetype,
        filename,
      };

      return repository.asset
        .create(assetData)
        .catch((error) => {
          throw new ApolloError(`Failed to add Asset. Original error: ${error.message}`, 400);
        });
    });
};
