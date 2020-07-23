const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const { ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { cdn } = require(path.resolve('config'));
const MIMEAssetTypes = require(path.resolve('src/lib/MIMEAssetTypes'));

const errorHandler = new ErrorHandler();

module.exports = async (_, { id, data }, { user, dataSources: { repository } }) => {
  const validator = new Validator(data, {
    id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
  });

  validator.addPostRule(async (provider) => {
    // check if the identifier is duplicated.
    if (data.identifier) {
      repository.banner.getAll({ identifier: data.identifier })
        .then(banners => {
          const otherBanners = banners.filter(banner => banner.id !== provider.inputs.id);
          if (otherBanners.length) provider.error('identifier', 'name', 'Banner with the given identifier already exists!');
        })
    }

    // check if name is duplicated.
    repository.banner.getAll({ name: provider.inputs.name })
      .then(banners => {
        const otherBanners = banners.filter(banner => banner._id !== provider.inputs.id);
        if (otherBanners.length) provider.error('name', 'custom', 'Banner with the given name already exists!');
      })
  });

  return validator.check()
    .then((matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      return repository.banner.getById(id);
    })
    .then(banner => {
      const keys = ['name', 'page', 'sitePath', 'assets', 'adType', 'size', 'type', 'layout', 'time'];
      keys.forEach(key => {
        if (data[key] !== undefined) {
          banner[key] = data[key];
        }
      })

      return banner.save();
    });
}
