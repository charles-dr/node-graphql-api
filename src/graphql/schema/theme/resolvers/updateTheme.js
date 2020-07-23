
const path = require("path");
const { Validator } = require("node-input-validator");
const { UserInputError, ForbiddenError, ApolloError } = require("apollo-server");

const { ErrorHandler } = require(path.resolve("src/lib/ErrorHandler"));
const errorHandler = new ErrorHandler();


module.exports = async (_, { id, data }, { dataSources: { repository }, user }) => {
  const validator = new Validator({
    id,
    ...data,
  }, {
    id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
  })

  validator.addPostRule(async provider => {
    await Promise.all([
      repository.theme.getById(provider.inputs.id),
      provider.inputs.name ? repository.theme.getByName(provider.inputs.name) : null,
      provider.inputs.thumbnail ? repository.asset.getById(provider.inputs.thumbnail) : null,
      provider.inputs.productCategories ? repository.productCategory.findByIds(provider.inputs.productCategories) : [],
      provider.inputs.brandCategories ? repository.brandCategory.findByIds(provider.inputs.brandCategories) : [],
      provider.inputs.brands ? repository.brand.getByIds(provider.inputs.brands) : [],
      provider.inputs.liveStreams ? repository.liveStream.getByIds(provider.inputs.liveStreams) : [],
      provider.inputs.liveStreamCategories ? repository.liveStreamCategory.getByIds(provider.inputs.liveStreamCategories): [],
      provider.inputs.featureProduct ? repository.product.getById(provider.inputs.featureProduct) : null,
    ])
    .then(([ themeById, themeByName, thumbnail, productCategories, brandCategories, brands, liveStreams, liveStreamCategories, featureProduct ]) => {
      if (!themeById) provider.error('id', 'custom', `Theme with id "${provider.inputs.id}" does not exist!`);

      if (provider.inputs.name && themeByName && themeByName._id !== id) provider.error('name', 'custom', `"${provider.inputs.name}" already exists with other theme!`);

      if (provider.inputs.thumbnail && !thumbnail) provider.error('thumbnail', 'custom', `Asset with id "${provider.inputs.thumbnail}" does not exist!`);

      if (provider.inputs.productCategories && productCategories) {
        const pcObj = {};
        productCategories.forEach(pcItem => pcObj[pcItem._id] = pcItem);
        const nonExistIds = provider.inputs.productCategories.filter(id => !pcObj[id]);
        nonExistIds.length > 0 ? provider.error('productCategories', 'custom', `Product categories with ids "${nonExistIds.join(", ")}" do not exist!`) : null;
      }

      if (provider.inputs.brandCategories && brandCategories) {
        const bcObj = {};
        brandCategories.forEach(bcItem => bcObj[bcItem._id] = bcItem);
        const nonExistIds = provider.inputs.brandCategories.filter(id => !bcObj[id]);
        nonExistIds.length > 0 ? provider.error('brandCategories', 'custom', `Brand categories with ids "${nonExistIds.join(", ")}" do not exist!`) : null;
      }

      if (provider.inputs.brands && brands) {
        const brandObj = {};
        brands.forEach(brand => brandObj[brand._id] = brand);
        const nonExistIds = provider.inputs.brands.filter(id => !brandObj[id]);
        nonExistIds.length > 0 ? provider.error('brands', 'custom', `Brands with ids "${nonExistIds.join(", ")}" do not exist!`) : null;
      }

      if (provider.inputs.liveStreams && liveStreams) {
        const streamObj = {};
        liveStreams.forEach(stream => streamObj[stream._id] = stream);
        const nonExistIds = provider.inputs.liveStreams.filter(id => !streamObj[id]);
        nonExistIds.length > 0 ? provider.error('liveStreams', 'custom', `Livestreams with ids "${nonExistIds.join(", ")}" do not exist!`) : null;
      }

      if (provider.inputs.liveStreamCategories && liveStreamCategories) {
        const categoryObj = {};
        liveStreamCategories.forEach(category => categoryObj[category._id] = category);
        const nonExistIds = provider.inputs.liveStreamCategories.filter(id => !categoryObj[id]);
        nonExistIds.length > 0 ? provider.error('liveStreamCategories', 'custom', `Livestream categories with ids "${nonExistIds.join(", ")}" do not exist!`) : null;
      }

      if (provider.inputs.featureProduct && !featureProduct) {
        provider.error('featureProduct', 'custom', `Product with id "${provider.inputs.featureProduct}" does not exist!`);
      }
    })
  })

  return validator.check()
    .then(matched => {
      if (!matched) throw errorHandler.build(validator.errors);

      return repository.theme.getById(id);
    })
    .then(theme => {
      const keys = ['name', 'thumbnail', 'hashtags', 'productCategories', 'brandCategories', 'brands', 'liveStreams', 'liveStreamCategories', 'type', 'start_time', 'end_time', 'featureProduct'];
      keys.forEach(key => {
        theme[key] = data[key] || theme[key];
      });

      return theme.save();
    })
}
