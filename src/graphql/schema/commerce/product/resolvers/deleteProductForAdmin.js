const path = require('path');
const { Validator } = require('node-input-validator');
const { ForbiddenError } = require('apollo-server');

const ProductService = require(path.resolve('src/lib/ProductService'));

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

module.exports = async (_, { id }, { dataSources: { repository }, user }) => {
  const validator = new Validator({ id }, {
    id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
  });

  let product;

  validator.addPostRule(async (provider) => (
    repository.product.getById(provider.inputs.id)
      .then((foundProduct) => {
        if (!foundProduct) {
          provider.error('id', 'custom', `Product with id "${provider.inputs.id}" doen not exist!`);
        }
        product = foundProduct;
      })
  ));

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    // .then(() => {
    //   if (user.id !== product.seller) {
    //     throw new ForbiddenError('You can not delete product!');
    //   }
    // })
    .then(() => {
      product.isDeleted = true;
      return product.save();
    })
    .then(async (savedProduct) => {
      await Promise.all([
        ProductService.updateProductCountInCategories([savedProduct.category]),
        ProductService.updateProductCountInBrand(savedProduct.brand),
      ]);
      return savedProduct.isDeleted;
    })
    .catch(() => false);
};
