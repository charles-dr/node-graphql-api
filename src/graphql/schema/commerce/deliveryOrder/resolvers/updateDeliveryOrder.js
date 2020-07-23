const path = require('path');
const { Validator } = require('node-input-validator');

const { DeliveryOrderStatus } = require(path.resolve('src/lib/Enums'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const PushNotificationService = require(path.resolve('src/lib/PushNotificationService'));
const { NotificationType, OrderItemStatus } = require(path.resolve('src/lib/Enums'));
const { InvoiceService } = require(path.resolve('src/lib/InvoiceService'));
const { EmailService } = require(path.resolve('src/bundles/email'));

const errorHandler = new ErrorHandler();

module.exports = async (_, { ids, data }, { dataSources: { repository }, user }) => {
  const validator = new Validator({ ...data, ids }, {
    ids: 'required|array',
    'ids.*': ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
    trackingNumber: 'required',
    carrier: ['required'],
    estimatedDeliveryDate: 'required',
    saleOrderId: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
  });

  let deliveryOrders=[];
  let carrierId;
  let saleOrder;

  validator.addPostRule(async (provider) => Promise.all([
    repository.deliveryOrder.getByIds(provider.inputs.ids),
    repository.carrier.getByName(provider.inputs.carrier),
    repository.saleOrder.getById(provider.inputs.saleOrderId),
    repository.organization.getByOwner(user.id),
  ])
    .then(async ([foundDeliveryOrders, foundCarrier, foundsaleOrder, organization]) => {
      if (!foundDeliveryOrders.length) {
        provider.error('id', 'custom', `DeliveryOrders with ids "${provider.inputs.ids}" doen not exist!`);
      }
      const customCarrier = await repository.customCarrier.getById(organization.customCarrier);
      if (foundCarrier) carrierId = foundCarrier.id;
      else if (organization && provider.inputs.carrier != customCarrier) {
        const carrierinfo = await repository.customCarrier.addByName({ name: provider.inputs.carrier });
        carrierId = carrierinfo.id;
      } else {
        carrierId = customCarrier.id;
      }
      foundDeliveryOrders.map((foundDeliveryOrder) => {
        if (foundDeliveryOrder.seller != user.id) {
          provider.error('permission', 'custom', 'You cannot change this order information.');
        }
      });
      deliveryOrders = foundDeliveryOrders;
      saleOrder = foundsaleOrder;
    }));
  //console.log('deliveryOrders1=>>>>>>>>>>>>>>>>>>>>>', ids);
  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
      console.log('deliveryOrders1=>>>>>>>>>>>>>>>>>>>>>', deliveryOrders);
      return deliveryOrders;
    })
    .then(async () => {
      deliveryOrders = await repository.deliveryOrder.getByIds(ids)
      console.log('deliveryOrders2=>>>>>>>>>>>>>>>>>>>>>', deliveryOrders);
      deliveryOrders.map((deliveryOrder) => {
        deliveryOrder.trackingNumber = data.trackingNumber;
        deliveryOrder.carrier = carrierId;
        deliveryOrder.status = DeliveryOrderStatus.SHIPPED;
        deliveryOrder.estimatedDeliveryDate = data.estimatedDeliveryDate;
        deliveryOrder.proofPhoto = data.proofPhoto;

        Promise.all([
          deliveryOrder.save(),
        ]);
      });
      // change sale, purchase order status
      saleOrder.status = DeliveryOrderStatus.SHIPPED;
      const purchaseOrder = await repository.purchaseOrder.getById(saleOrder.purchaseOrder);
      purchaseOrder.status = DeliveryOrderStatus.SHIPPED;

      // update invoice
      const orderDetails = await InvoiceService.getOrderDetails(purchaseOrder.id);
      const pdf = InvoiceService.createInvoicePDF(orderDetails);
      purchaseOrder.invoicePDF = pdf;
      EmailService.sendInvoicePDFs(purchaseOrder);
      Promise.all([
        saleOrder.save(),
        purchaseOrder.save(),
      ]);
      // push notification
      const orderItems = await repository.orderItem.getByIds(saleOrder.items);
      const buyer = await repository.user.getById(saleOrder.buyer);
      let message = '';

      message = await Promise.all(orderItems.map(async (item) => {
        let str = "'";
        const productInfo = await repository.product.getById(item.product);
        str += productInfo.title;
        if (item.productAttribute) {
          const attr = await repository.productAttributes.getById(item.productAttribute);
          str += '(';
          console.log('variation =>', attr.variation);
          attr.variation.map((attrItem) => {
            str += `${attrItem.name}: ${attrItem.value},`;
          });
          str += ')';
        }
        str += "', ";
        return str;
      }));
      message += ' were shipped.';
      console.log('message =>', message);

      await repository.notification.create({
        type: NotificationType.BUYER_ORDER,
        user: buyer.id,
        data: {
          content: message,
          name: 'Your order was shipped.',
          photo: null,
          date: saleOrder.createdAt,
          status: OrderItemStatus.CONFIRMED,
          linkID: saleOrder.purchaseOrder,
        },
        tags: ['Order:order.id'],
      });
      if (buyer.device_id) {
        await PushNotificationService.sendPushNotification({
          message,
          device_ids: [buyer.device_id],
        });
      }
      console.log('deliveryOrders=>>>>>>>>>>>>>>>>>>>>>', deliveryOrders);
      return deliveryOrders;
    });
};
