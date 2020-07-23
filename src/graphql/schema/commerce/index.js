const { merge } = require('lodash');

const { typeDefs: commonTypeDefs, resolvers: commonResolvers } = require('./common');
const { typeDefs: carrierTypeDefs, resolvers: carrierResolvers } = require('./carrier');
const { typeDefs: customCarrierTypeDefs, resolvers: customCarrierResolvers } = require('./customcarrier');
const { typeDefs: brandTypeDefs, resolvers: brandResolvers } = require('./brand');
const { typeDefs: brandCategoryTypeDefs, resolvers: brandCategoryResolvers } = require('./brandCategory');
const { typeDefs: cartTypeDefs, resolvers: cartResolvers } = require('./cart');
const { typeDefs: productCategoryTypeDefs, resolvers: productCategoryResolvers } = require('./productCategory');
const { typeDefs: productTypeDefs, resolvers: productResolvers } = require('./product');
const { typeDefs: productVariationTypeDefs, resolvers: productVariationResolvers } = require('./productVariation');
const { typeDefs: purchaseOrderTypeDefs, resolvers: purchaseOrderResolvers } = require('./purchaseOrder');
const { typeDefs: saleOrderTypeDefs, resolvers: saleOrderResolvers } = require('./saleOrder');
const { typeDefs: deliveryAddressTypeDefs, resolvers: deliveryAddressResolvers } = require('./deliveryAddress');
const { typeDefs: shippingOrderTypeDefs, resolvers: shippingOrderResolvers } = require('./deliveryOrder');
const { typeDefs: deliveryCalcTypeDefs, resolvers: deliveryCalcResolvers } = require('./deliveryCalculation');
const { typeDefs: payoutOrderTypeDefs, resolvers: payoutOrderResolvers } = require('./payoutOrder');
const { typeDefs: orderItemTypeDefs, resolvers: orderItemResolvers } = require('./orderItem');
const { typeDefs: shippingAddressDefs, resolvers: shippingAddressResolvers } = require('./shippingAddress');
const { typeDefs: discountDefs, resolvers: discountResolvers } = require('./discount');

const typeDefs = [].concat(
  brandTypeDefs,
  brandCategoryTypeDefs,
  cartTypeDefs,
  productCategoryTypeDefs,
  productTypeDefs,
  productVariationTypeDefs,
  commonTypeDefs,
  deliveryAddressTypeDefs,
  deliveryCalcTypeDefs,
  purchaseOrderTypeDefs,
  saleOrderTypeDefs,
  shippingOrderTypeDefs,
  payoutOrderTypeDefs,
  orderItemTypeDefs,
  carrierTypeDefs,
  customCarrierTypeDefs,
  shippingAddressDefs,
  discountDefs
);

const resolvers = merge(
  brandResolvers,
  brandCategoryResolvers,
  cartResolvers,
  productCategoryResolvers,
  productResolvers,
  productVariationResolvers,
  commonResolvers,
  deliveryAddressResolvers,
  deliveryCalcResolvers,
  purchaseOrderResolvers,
  saleOrderResolvers,
  shippingOrderResolvers,
  payoutOrderResolvers,
  orderItemResolvers,
  carrierResolvers,
  customCarrierResolvers,
  shippingAddressResolvers,
  discountResolvers
);

module.exports = {
  typeDefs,
  resolvers,
};
