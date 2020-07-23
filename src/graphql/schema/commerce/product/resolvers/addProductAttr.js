const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { InventoryLogType } = require(path.resolve('src/lib/Enums'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { ForbiddenError } = require('apollo-server');
const ProductService = require(path.resolve('src/lib/ProductService'));

const errorHandler = new ErrorHandler();

module.exports = async (_, { data }, { dataSources: { repository }, user }) => {
  const validator = new Validator(data, {
    productId: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
    variation: 'required',
    price: 'required|decimal',
    quantity: 'required|integer',
    asset: 'required',
  });

  let foundProduct;

  validator.addPostRule(async (provider) => Promise.all([
      repository.product.getById(provider.inputs.productId),
      provider.inputs.sku ? repository.productAttributes.checkDuplicatedSKU(provider.inputs.sku) : 0
  ])
  .then(([product, countDuplicatedSku]) => {
      if (!product) {
          provider.error('Product', 'custom', `Product with id "${provider.inputs.productId}" does not exist!`);
      }
      if (countDuplicatedSku > 0) {
          provider.error('SKU', 'custom', `SKU with value "${provider.inputs.sku}" is already exist!`);
      }
      foundProduct = product;
  }));

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      if (user.id !== foundProduct.seller) {
        throw new ForbiddenError('You can not update product!');
      }

      const productAttrId = uuid();
      const inventoryId = uuid();

      const {
        quantity, price, oldPrice, ...productData
      } = data;

      if (productData.sku && productData.sku.indexOf(' ') >= 0) {
        throw new ForbiddenError('SKU should not include space!');
      }
      productData._id = productAttrId;
      productData.quantity = quantity;
      productData.price = CurrencyFactory.getAmountOfMoney({ currencyAmount: price, currency: data.currency }).getCentsAmount();
      productData.oldPrice = oldPrice ? CurrencyFactory.getAmountOfMoney({ currencyAmount: oldPrice, currency: data.currency }).getCentsAmount() : null;

      foundProduct.attrs.push(productAttrId);
      const inventoryLog = {
        _id: inventoryId,
        product: data.productId,
        productAttribute: productAttrId,
        shift: quantity,
        type: InventoryLogType.USER_ACTION,
      };

      return Promise.all([
        repository.productAttributes.create(productData),
        foundProduct.save(),
        repository.productInventoryLog.add(inventoryLog),
      ])
        .then(async ([productAttr, updatedProduct, inventoryLog]) => Promise.all([
            productAttr,
            ProductService.setProductQuantityFromAttributes(updatedProduct.id),
          ]))
        .then(([productAttr]) => productAttr);
    });
};
