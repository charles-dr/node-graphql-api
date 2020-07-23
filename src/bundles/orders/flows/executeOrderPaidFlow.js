/**
 * @name: executeOrderPaidFlow
 * @description: post-process the successful purchase order. Triggered from webhooks(success).
 * @summary:
 *  - update purchase order status: { isPaid: true, status: ORDERED }
 *  - send buyer & seller notifications that the products are sold out.
 *  - increase product.sold by orderitem.quantity
 *  - update the status of order items -> ORDERED
 *
 */

/* eslint-disable no-param-reassign */
const path = require('path');
const uuid = require('uuid/v4');

const logger = require(path.resolve('config/logger'));
const repository = require(path.resolve('src/repository'));
const {
  InventoryLogType, NotificationType, OrderItemStatus, PurchaseOrderStatus,
} = require(path.resolve('src/lib/Enums'));
const { PaymentMethodProviders } = require(path.resolve('src/lib/Enums'));
const ProductService = require(path.resolve('src/lib/ProductService'));
const PushNotificationService = require(path.resolve('src/lib/PushNotificationService'));


module.exports = async (purchaseOrder) => {
  purchaseOrder.isPaid = true;
  purchaseOrder.status = PurchaseOrderStatus.ORDERED;

  const orderItems = await repository.orderItem.getByIds(purchaseOrder.items);


  // Divide between sellers for make saleorders for each
  const itemsBySeller = orderItems.reduce((result, orderItem) => {
    const { seller } = orderItem;
    if (typeof result[seller] === 'undefined') {
      // eslint-disable-next-line no-param-reassign
      result[seller] = [];
    }
    result[seller].push(orderItem);
    return result;
  }, {});

  try {
    const buyer = await repository.user.getById(purchaseOrder.buyer);
    orderItems.map(async (item) => {
      const { product, quantity } = item;
      const productInfo = await repository.product.getById(product);
      const seller = await repository.user.getById(productInfo.seller);
      // update sold count of product.
      await ProductService.productSoldout({ product, quantity }, repository);

      // save notification to seller
      await repository.notification.create({
        type: NotificationType.SELLER_ORDER,
        user: productInfo.seller,
        data: {
          content: purchaseOrder.title,
          name: productInfo.title,
          photo: productInfo.assets,
          date: purchaseOrder.createdAt,
          status: OrderItemStatus.CONFIRMED,
          linkID: purchaseOrder.id,
        },
        tags: [`Order:${purchaseOrder.id}`],
      });
      // send push notification to seller
      if (seller.device_id) { await PushNotificationService.sendPushNotification({ message: `Your product-${productInfo.title} was sold.`, device_ids: [seller.device_id] }); }
    });
    // save notification to buyer
    await repository.notification.create({
      type: NotificationType.BUYER_ORDER,
      user: buyer.id,
      data: {
        content: purchaseOrder.title,
        name: purchaseOrder.title,
        photo: null,
        date: purchaseOrder.createdAt,
        status: OrderItemStatus.CONFIRMED,
        linkID: purchaseOrder.id,
      },
      tags: ['Order:order.id'],
    });
    // send push notification to buyer
    if (buyer.device_id) { await PushNotificationService.sendPushNotification({ message: 'You paid your money to buy the products of your cart', device_ids: [buyer.device_id] }); }
  } catch (e) {
    logger.error(`[PURCHASE_ORDER_PAID_FLOW][${purchaseOrder.id}][NOTIFICATION & EMAIL] ${e.message}`);
  }


  return Promise.all(orderItems.map((orderItem) => {
    const baseInventoryLog = {
      product: orderItem.product,
      productAttribute: orderItem.productAttribute,
    };
    return Promise.all([
      repository.productInventoryLog.add({
        ...baseInventoryLog, _id: uuid(), type: InventoryLogType.PURCHASE, shift: -orderItem.quantity,
      }),
      repository.productInventoryLog.add({
        ...baseInventoryLog, _id: uuid(), type: InventoryLogType.BUYER_CART, shift: orderItem.quantity,
      }),
    ]);
  }))
  .then(() => Promise.all([
    purchaseOrder.save(),
    repository.orderItem.changeStatus(purchaseOrder.items, OrderItemStatus.ORDERED),
    // ...saleOrderPromisses, // #checkoutMethods
    repository.saleOrder.getAll({ purchaseOrder: purchaseOrder.id }),
  ]))
  .then(([purchaseOrder, , orders]) => {
    const saleOrderIds = orders.map((order) => order.id);
    logger.info(`[PURCHASE_ORDER_PAID_FLOW][${purchaseOrder.id}] success! SaleOrders "${saleOrderIds.join(', ')}" paid`);
    return purchaseOrder;
  })
  .catch((error) => {
    logger.error(`[PURCHASE_ORDER_PAID_FLOW][${purchaseOrder.id}] failed! error "${error.message}" ${error.stack}`);
  });
};
