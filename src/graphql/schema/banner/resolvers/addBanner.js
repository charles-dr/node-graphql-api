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
    identifier: "required",
    name: "required",
    sitePath: "required",
    assets: "required",
    adType: "required",
    type: "required",
    layout: "required",
    size: "required",
  });

  validator.addPostRule(async (provider) => {
    // check if  identifier is duplicated or not.
    await repository.banner.getOne({ identifier: provider.inputs.identifier })
      .then(banner => {
        if (banner) provider.error('identifier', 'custom', 'Banner with the given identifier already exists!');
      })
    // check if name is duplicated.
    await repository.banner.getByName(provider.inputs.name)
      .then(banner => {
        if (banner) provider.error('name', 'custom', 'Banner with the given name already exists!');
      })
  });

  return validator.check()
    .then((matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      const bannerId = uuid();

      const bannerData = {
        _id: bannerId,
        ...data,
      };

      return repository.banner
        .create(bannerData)
        .catch((error) => {
          throw new ApolloError(`Failed to add Banner. Original error: ${error.message}`, 400);
        });
    });
};
