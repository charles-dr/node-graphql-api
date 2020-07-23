const path = require('path');
const { ForbiddenError } = require('apollo-server');
const checkout = require('../checkoutMethods');

const { payPurchaseOrder } = require(path.resolve('src/bundles/payment'));
const PushNotificationService = require(path.resolve('src/lib/PushNotificationService'));
const { NotificationType, OrderItemStatus, PaymentMethodProviders } = require(path.resolve('src/lib/Enums'));

module.exports = async function checkoutCart(
  _,
  { currency, provider,customCarrierPrice, redirection, paymentMethodNonce },
  { dataSources: { repository }, user },
) {
  let cartItems = await checkout.loadCartAndValidate(user.id, repository);
  cartItems = cartItems.filter(item => item.selected);
  if (!cartItems.length) throw new ForbiddenError("Please select items to checkout!");

  // creating order and clean cart
  const order = await checkout.createOrder({
    cartItems, currency, buyerId: user.id,customCarrierPrice
  }, repository);

  // await checkout.clearUserCart(user.id, repository);
  redirection.success+="&orderId="+order.id
  redirection.cancel+="&orderId="+order.id
  // generate payments with Payment Provider data and update order
  return payPurchaseOrder({ order, provider, redirection, paymentMethodNonce, user })
    .then(async (result) => {
      if (result.error) { order.error = result.error; }

      if (result.publishableKey) { order.publishableKey = result.publishableKey; }
      if (result.paymentClientSecret) { order.paymentClientSecret = result.paymentClientSecret; }

      order.deliveryOrders = null;
      // order.isPaid = [PaymentMethodProviders.PAYPAL].includes(provider) ? false : true;
      return repository.purchaseOrder.update(order);
    })
};
