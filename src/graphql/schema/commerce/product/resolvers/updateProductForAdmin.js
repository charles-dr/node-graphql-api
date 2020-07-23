const path = require('path');
const { Validator } = require('node-input-validator');
const { ForbiddenError } = require('apollo-server');

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { translate } = require(path.resolve('src/lib/TranslateService'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

const activity = {
  translateProduct: async (product, repository) => {
    return Promise.all([
      translate('ko', product.title),
      translate('zh', product.title),
      translate('ko', product.description),
      translate('zh', product.description),
    ])
      .then(([ koTitle, zhTitle, koDescription, zhDescription ]) => {
        const title = {
          en: product.title,
          ko: koTitle,
          zh: zhTitle,
        };
        const description = {
          en: product.description,
          ko: koDescription,
          zh: zhDescription,
        };

        return repository.productTranslation.updateProduct(product.id, { title, description });
      })
  },
}

module.exports = async (_, { id, data }, { dataSources: { repository }, user }) => {
  const validator = new Validator({ ...data, id }, {
    id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
    title: 'required',
    description: 'required',
    shippingBox: 'required',
    // 'weight.value': 'required|decimal',
    // 'weight.unit': 'required',
    price: 'required|decimal',
    quantity: 'required|integer',
    currency: 'required',
    assets: 'required|length:9,1',
  }, {
    'assets.length': 'You can not upload more than 9 images!',
  });

  let product;

  validator.addPostRule(async (provider) => Promise.all([
    repository.product.getById(provider.inputs.id),
    repository.productCategory.getById(provider.inputs.category),
    repository.brand.getById(provider.inputs.brand),
    repository.shippingBox.findOne(provider.inputs.shippingBox),
  ])
    .then(([foundProduct, category, brand, shippingBox]) => {
      if (!foundProduct) {
        provider.error('id', 'custom', `Product with id "${provider.inputs.id}" doen not exist!`);
      }

      if (!category) {
        provider.error('category', 'custom', `Category with id "${provider.inputs.category}" doen not exist!`);
      }

      if (!brand) {
        provider.error('brand', 'custom', `Brand with id "${provider.inputs.brand}" doen not exist!`);
      }

      if (!shippingBox) {
        provider.error('shippingBox', 'custom', `Shipping Box with id "${provider.inputs.shippingBox}" does not exist!`);
      }

      product = foundProduct;
    }));

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => {
      if (user.id !== product.seller) {
        throw new ForbiddenError('You can not update product!');
      }
    })
    .then(async () => {
      let customCarrier;
      if (data.customCarrier) {
        customCarrier = await repository.customCarrier.findByName(data.customCarrier);
        if (!customCarrier) {
          throw new ForbiddenError(`Can not find customCarrier with "${data.customCarrier}" name`);
        }
      }

      const {
        quantity, price, discountPrice, ...productData
      } = data;

      product.title = productData.title;
      product.description = productData.description;
      product.price = CurrencyFactory.getAmountOfMoney({ currencyAmount: data.discountPrice || data.price, currency: data.currency }).getCentsAmount();
      product.oldPrice = data.discountPrice ? CurrencyFactory.getAmountOfMoney({ currencyAmount: data.price, currency: data.currency }).getCentsAmount() : null;
      product.quantity = quantity;
      product.customCarrier = customCarrier ? customCarrier.id : null;
      product.customCarrierValue = customCarrier ? CurrencyFactory.getAmountOfMoney({ currencyAmount: data.customCarrierValue, currency: data.currency }).getCentsAmount() : 0;

      product.category = productData.category;
      product.brand = productData.brand;
      product.freeDeliveryTo = data.freeDeliveryTo;
      product.currency = productData.currency;
      product.shippingBox = data.shippingBox;
      if (productData.thumbnailId) {
        const thumbnail = await repository.asset.load(productData.thumbnailId);
        if (thumbnail) { productData.thumbnail = productData.thumbnailId; } else { throw new ForbiddenError(`Thumbnail with id "${productData.thumbnailId}" does not exist!`); }
      }

      const amountOfMoney = CurrencyFactory.getAmountOfMoney(
        { centsAmount: data.price, currency: data.currency },
      );
      const sortPrice = await CurrencyService.exchange(amountOfMoney, 'USD')
        .then((exchangedMoney) => exchangedMoney.getCentsAmount());
      product.sortPrice = sortPrice;
      product.assets = productData.assets;

      // product.weight = data.weight;
      return Promise.all([
        product.save(),
        repository.productInventoryLog.getByProductId(product.id),
        activity.translateProduct(product, repository),
      ])
        .then(async ([updatedProduct, inventory]) => {
          await repository.productInventoryLog.update(inventory.id, updatedProduct.quantity);
          return updatedProduct;
        });
    });
};
