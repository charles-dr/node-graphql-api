const path = require('path');
const { Validator } = require('node-input-validator');
const { ForbiddenError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

module.exports = async (
  _,
  { id, assetId },
  { dataSources: { repository }, user },
) => {
  const validator = new Validator(
    { id, assetId },
    {
      id: [
        'required',
        [
          'regex',
          '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}',
        ],
      ],
      assetId: [
        'required',
        [
          'regex',
          '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}',
        ],
      ],
    },
  );

  let product;

  validator.addPostRule(async (provider) => Promise.all([
    repository.product.getById(provider.inputs.id),
    repository.asset.load(provider.inputs.assetId),
  ])
    .then(([foundProduct, foundAsset]) => {
      if (!foundProduct) {
        provider.error('id', 'custom', `Product with id "${provider.inputs.id} does not exist!"`);
      } else {
        product = foundProduct;
      }

      if (!foundAsset) {
        provider.error('assetId', 'custom', `Asset with id "${provider.inputs.id} does not exist!"`);
      }
    }));

  return validator
    .check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => {
      if (user.id !== product.seller) {
        throw new ForbiddenError('You can not update product info!');
      }
    })
    .then(() => {
      product.thumbnail = assetId;
      return product.save();
    })
    .then((savedProduct) => true);
};
