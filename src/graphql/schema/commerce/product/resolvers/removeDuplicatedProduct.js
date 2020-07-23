const path = require('path');

const { Validator } = require('node-input-validator');
const ProductService = require(path.resolve('src/lib/ProductService'));

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

module.exports = async (_, {id}, { dataSources: { repository }, user }) => {
  const validator = new Validator({ id }, {
    id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
  });

  let product;

  validator.addPostRule(async (provider) => {
    await repository.product.getById(provider.inputs.id)
      .then((foundProduct) => {
        if (!foundProduct) {
          provider.error('id', 'custom', `Product with id "${provider.inputs.id}" doen not exist!`);
        }
        product = foundProduct;
      })
  });

  return validator.check()
    .then((matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(async () => {
      const duplicated = await repository.product.getProductsForRemove({
        description: product.description,
        seller: product.seller, 
        sort: { feature: 'CREATED_AT', type: 'DESC' }, 
      });

      let removedProducts = [];
      if (duplicated.length > 1) {
        for (i = 1; i < duplicated.length; i++) {
          await repository.productAttributes.removeByProduct(duplicated[i]['_id']);
          await repository.product.removeProduct(duplicated[i]['_id']);
          removedProducts.push(duplicated[i]['_id']);
        }
      }

      return removedProducts;
    })
    .then((removedProducts) => {
      return {
        success: true,
        removed: removedProducts
      };
    })
    .catch((err) => {
      console.log(err);
      return {
        success: false,
        reason: err.toString()
      }
    });
};
