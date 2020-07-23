/* eslint-disable no-param-reassign */
const { ForbiddenError } = require('apollo-server');
const path = require('path');

const { DiscountValueType, DiscountPrivileges } = require(path.resolve('src/lib/Enums'));

module.exports = async (_, args, { dataSources: { repository }, user }) => repository.userCartItem
  .getAll({ user: user.id })
  .then((items) => Promise.all(items.map(async (item) => {
    item.product = await repository.product.getById(item.product)
      .then((product) => {
        if (!product) { throw new ForbiddenError(`Product with id "${item.product}" does not exist`); }

        return product;
      });
    item.deliveryRate = await repository.deliveryRate.getById(item.deliveryRate)
      .then((deliveryRate) => deliveryRate);
    console.log("item.discount", item.discount)
    let discountAmount = 0;
    let isApplyDiscount = false;
    if (item.discount) {
      item.discount = await repository.discount.getById(item.discount)
        .then((discount) => discount);
        const discount=item.discount
      const brand = await repository.brand.getById(item.product.brand)
      const productBrandCategories = brand.brandCategories || [];
      console.log("brand", brand)
      let commonBrandCategoriesCount = 0;
      productBrandCategories.forEach((pbCategory) => {
        if (discount.brand_categories.findIndex((dbc) => dbc === pbCategory.id > -1)) {
          commonBrandCategoriesCount += 1;
        }
      });
      if (discount.privilege === DiscountPrivileges.EVERYONEY) {
        isApplyDiscount = true;
      } else if (discount.privilege === DiscountPrivileges.CUSTOMERS
        && user.isAnonymous === false) {
        isApplyDiscount = true;
      } else if (discount.products.findIndex((pItem) => pItem === product.id) > -1) {
        isApplyDiscount = true;
      } else if (discount.all_product === true) {
        isApplyDiscount = true;
      } else if (discount.brands.findIndex((brand) => brand === product.brand.id) > -1) {
        isApplyDiscount = true;
      } else if (commonBrandCategoriesCount > 0) {
        isApplyDiscount = true;
      } else if (discount.isActive === true) {
        isApplyDiscount = true;
      } else if (new Date(discount.startAt) < new Date() && new Date(discount.endAt) < new Date()) {
        isApplyDiscount = true;
      } else {
        isApplyDiscount = false;
      }
      console.log({ isApplyDiscount, discount })
      if (isApplyDiscount === true) {
        if (discount.value_type === DiscountValueType.FREE_SHIPPING) {
          if (deliveryRate.amount) discountAmount = deliveryRate.amount;
        } else if (discount.value_type === DiscountValueType.FIXED) {
          discountAmount = discount.amount;
        } else if (discount.value_type === DiscountValueType.PERCENT) {
          discountAmount = (discount.amount * product.price * quantity) / 100;
        } else {
          discountAmount = 0;
        }
      } else {
        discountAmount = 0;
      }
      item.discountAmount = discountAmount
    } else {
      item.discount = null
      item.discountAmount = discountAmount
    }
    console.log("item.discountAmount",item.discountAmount)
    if (item.productAttribute) {
      item.productAttribute = await repository.productAttributes.getById(item.productAttribute);
    }

    return item;
  }))
    .then((items) => ({ items })));
