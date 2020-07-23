const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const { ForbiddenError } = require('apollo-server');

const { InventoryLogType } = require(path.resolve('src/lib/Enums'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { AssetService } = require(path.resolve('src/lib/AssetService'));
const ProductService = require(path.resolve('src/lib/ProductService'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

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

  let product, foundBrand;

  validator.addPostRule(async (provider) => Promise.all([
    repository.product.getById(provider.inputs.id),
    repository.productCategory.getById(provider.inputs.category),
    repository.brand.getById(provider.inputs.brand),
    repository.shippingBox.findOne(provider.inputs.shippingBox),
    repository.asset.load(provider.inputs.thumbnailId)
  ])
    .then(([foundProduct, category, brand, shippingBox, thumbnail]) => {
      if (!foundProduct) {
        provider.error('id', 'custom', `Product with id "${provider.inputs.id}" doen not exist!`);
      }

      if (!category) {
        provider.error('category', 'custom', `Category with id "${provider.inputs.category}" doen not exist!`);
      }

      if (!brand) {
        provider.error('brand', 'custom', `Brand with id "${provider.inputs.brand}" doen not exist!`);
      } else {
        foundBrand = brand;
      }

      if (!shippingBox) {
        provider.error('shippingBox', 'custom', `Shipping Box with id "${provider.inputs.shippingBox}" does not exist!`);
      }

      if (!thumbnail) {
        provider.error('thumbnail', 'custom', `Asset with id "${provider.inputs.thumbnailId}" does not exist!`);
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
        quantity, price, discountPrice, thumbnailId, ...productData
      } = data;

      const deltaQty = quantity - product.quantity;

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
      product.thumbnail = thumbnailId;
      product.isFeatured = data.isFeatured !== undefined ? data.isFeatured : (product.isFeatured || false);
      product.slug = await ProductService.generateSlug({ slug: data.slug, title: data.title, id });
      product.metaDescription = data.metaDescription || product.metaDescription;
      product.metaTags = data.metaTags || product.metatags;
      product.seoTitle = data.seoTitle || product.setTitle;
      product.hashtags = productData.hashtags = ProductService.composeHashtags(data.hashtags || product.hashtags, foundBrand);
      // resize thumbnail
      const thumbnail = await repository.asset.getById(thumbnailId);
      
      if (thumbnail &&  (
        !thumbnail.resolution ||
        (thumbnail.resolution.width && thumbnail.resolution.width > 200))) {
        await AssetService.resizeImage({ assetId: thumbnailId, width: 200 });
      }

      const amountOfMoney = CurrencyFactory.getAmountOfMoney(
        { centsAmount: data.price, currency: data.currency })
      const sortPrice = await CurrencyService.exchange(amountOfMoney, "USD")
        .then((exchangedMoney) => exchangedMoney.getCentsAmount());
      product.sortPrice = sortPrice
      product.wholesaleEnabled = data.wholesaleEnabled || false;
      product.metrics = [];
      if (data.metrics && data.metrics.length > 0) {
        data.metrics.forEach(metricItem => {
          product.metrics.push({
            metricUnit: metricItem.metricUnit,
            minCount: metricItem.minCount || 0,
            unitPrice: {
              amount: CurrencyFactory.getAmountOfMoney({ currencyAmount: metricItem.unitPrice.amount, currency: metricItem.unitPrice.currency }).getCentsAmount(),
              currency: metricItem.unitPrice.currency
            },
            quantity: metricItem.quantity
          });
        });
      }

      let inventoryPromise = null;
      if (deltaQty !== 0 && product.attrs.length === 0) {
        const newInventoryLog = {
          _id: uuid(),
          product: product.id,
          productAttribute: null,
          shift: deltaQty,
          type: InventoryLogType.USER_ACTION,
        };
        inventoryPromise = repository.productInventoryLog.add(newInventoryLog);
      }

      // product.weight = data.weight;
      return Promise.all([
        product.save(),
        // repository.productInventoryLog.getByProductId(product.id),
        inventoryPromise,
      ])
        .then(async ([updatedProduct, inventory]) => {
          // await repository.productInventoryLog.update(inventory.id, updatedProduct.quantity);
          return updatedProduct;
        });
    });
};
