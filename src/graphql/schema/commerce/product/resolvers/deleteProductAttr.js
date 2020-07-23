const path = require('path');
const { Validator } = require('node-input-validator');
const { ForbiddenError } = require('apollo-server');
const ProductService = require(path.resolve('src/lib/ProductService'));

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

module.exports = async (_, { id, productId }, { dataSources: { repository }, user }) => {
  const validator = new Validator({ id, productId }, {
    id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
    productId: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
  });

  let product;
  let productAttr;

  validator.addPostRule(async (provider) => Promise.all([
    repository.productAttributes.getById(provider.inputs.id),
    repository.product.getById(provider.inputs.productId),
  ])
    .then(([foundProductAttr, foundProduct]) => {
      let i = -1;
      if (!foundProduct) {
        provider.error('id', 'custom', `Product with id "${provider.inputs.productId}" doen not exist!`);
      }
      if (!foundProductAttr) {
        provider.error('id', 'custom', `ProductAttr with id "${provider.inputs.id}" doen not exist!`);
      }
      foundProduct.attrs.map((item, index) => {
        if (item == provider.inputs.id) 
          i = index;
      });
      if (i == -1) {
        provider.error('id', 'custom', `ProductAttr with id "${provider.inputs.id}" doen not exist in Product attributes!`);
      }
      product = foundProduct;
      productAttr = foundProductAttr;
    })
  );

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => {
      product.attrs.map((item, index) => {
        if (item == id) { product.attrs.splice(index, 1); }
      });
      return product.save();
    })
    .then(async (savedProduct) => {
      await ProductService.setProductQuantityFromAttributes(savedProduct.id);
      return true;
    })
    .catch(() => false);
};
