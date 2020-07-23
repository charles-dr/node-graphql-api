const path = require('path');
const { ForbiddenError } = require('apollo-server');
const checkout = require('../checkoutMethods');

const PushNotificationService = require(path.resolve('src/lib/PushNotificationService'));
const ProductService = require(path.resolve('src/lib/ProductService'));
const { NotificationType, OrderItemStatus } = require(path.resolve('src/lib/Enums'));
const { payPurchaseOrder } = require(path.resolve('src/bundles/payment'));


module.exports = async function checkoutOneProduct(
  _,
  {
    deliveryRate, product, quantity, currency, provider, productAttribute, billingAddress, note, redirection,
  },
  { dataSources: { repository }, user },
) {

  const productAttr = productAttribute ? await repository.productAttributes.getById(productAttribute) : null;
  if (!productAttr && productAttribute) {
    throw new ForbiddenError('Product does not exist.');
  }

  // const checkAmount = productAttr
  //   ? await repository.productAttributes.checkAmountByAttr(productAttribute, quantity)
  //   : await repository.productInventoryLog.checkAmount(product, quantity);
  const checkAmount = await ProductService.checkProductQuantityAvailable({ product, quantity, productAttribute }, repository);

  const cartItems = productAttr
    ? await checkout.loadProductAsCartByAttr(deliveryRate, product, quantity, repository, productAttribute, billingAddress, note)
    : await checkout.loadProductAsCart(deliveryRate, product, quantity, repository, billingAddress, note);

  if (checkAmount) {
    const delivery = await repository.deliveryRateCache.getById(deliveryRate);
    if (!delivery) {
      throw new ForbiddenError('Product\'s delivery information is incorrect.');
    }
    const cartItemData = {
      productId: product,
      quantity,
      productAttribute, // != null ? cartItems[0].productAttribute : null,
      deliveryRateId: delivery.id,
      billingAddress,
      note,
    };

    const deliveryrate = await repository.deliveryRate.getById(delivery.id);
    if (!deliveryrate) {
      const cart = await repository.deliveryRate.create(delivery.toObject());
    }

    await repository.userCartItem.add(cartItemData, user.id);

    // creating order
    const order = await checkout.createOrder({
      cartItems, currency, buyerId: user.id,
    }, repository);

    // const prod = await repository.product.getById(product).then((product) => product.customCarrier);

    return payPurchaseOrder({ order, provider, user, redirection })
      .then(async (result) => {
        if (result.error) { order.error = result.error; }

        if (result.publishableKey) { order.publishableKey = result.publishableKey; }
        if (result.paymentClientSecret) { order.paymentClientSecret = result.paymentClientSecret; }

        order.deliveryOrders = null;
        return repository.purchaseOrder.update(order);
      })
  } else {
    const order = await checkout.createOrder({
      cartItems, currency, buyerId: user.id,
    }, repository);
    order.error = 'This product is not enough now';
    return order;
  }
};
