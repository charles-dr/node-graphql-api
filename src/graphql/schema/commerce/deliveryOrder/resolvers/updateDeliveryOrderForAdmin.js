const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError } = require('apollo-server');

const { DeliveryOrderStatus } = require(path.resolve('src/lib/Enums'));
const PushNotificationService = require(path.resolve('src/lib/PushNotificationService'));
const { NotificationType, OrderItemStatus } = require(path.resolve('src/lib/Enums'));
const { InvoiceService } = require(path.resolve('src/lib/InvoiceService'));
const { EmailService } = require(path.resolve('src/bundles/email'));

module.exports = async (_, { id, data }, { dataSources: { repository } }) => {
  const validator = new Validator({ ...data, id }, {
    // ids: 'required|array',
    // 'ids.*': ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
    id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
    carrier: ['required'],
    saleOrderId: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
  });

  let deliveryOrder;
  let carrierId;
  let saleOrder;

  validator.addPostRule(async (provider) => Promise.all([
    repository.deliveryOrder.getById(provider.inputs.id),
    repository.carrier.getByName(provider.inputs.carrier),
    repository.saleOrder.getById(provider.inputs.saleOrderId),
  ])
    .then(async ([foundDeliveryOrder, foundCarrier, foundsaleOrder]) => {
      if (!foundDeliveryOrder) {
        provider.error('id', 'custom', `DeliveryOrder with id "${provider.inputs.id}" doen not exist!`);
      }

      if (!foundsaleOrder) {
        provider.error('saleOrderId', 'custom', `SaleOrder with id "${provider.inputs.saleOrderId}" doen not exist!`);
      }

      deliveryOrder = foundDeliveryOrder;
      saleOrder = foundsaleOrder;

      if (foundsaleOrder) {
        const organization = await repository.organization.getByOwner(foundsaleOrder.seller);
        if (!organization) provider.error('seller', 'custom', 'Seller is invalid now');
        else {
          const customCarrier = await repository.customCarrier.getById(organization.customCarrier);
          if (foundCarrier) {
            carrierId = foundCarrier.id;
          } else if (organization && provider.inputs.carrier != customCarrier.name) {
            const carrierinfo = await repository.customCarrier.addByName({ name: provider.inputs.carrier });
            carrierId = carrierinfo.id;
          } else {
            carrierId = customCarrier.id;
          }
        }
      }
    }));

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        // throw errorHandler.build(validator.errors);
        throw new UserInputError(validator.errors);
      }
    })
    .then(async () => {
      deliveryOrder.trackingNumber = data.trackingNumber || deliveryOrder.trackingNumber;
      deliveryOrder.carrier = carrierId;
      deliveryOrder.status = data.status || deliveryOrder.status;
      deliveryOrder.estimatedDeliveryDate = data.estimatedDeliveryDate || deliveryOrder.estimatedDeliveryDate;
      deliveryOrder.proofPhoto = data.proofPhoto || deliveryOrder.proofPhoto;

      deliveryOrder.save();

      // change sale, purchase order status
      saleOrder.status = data.status || saleOrder.status;
      saleOrder.save();

      const purchaseOrder = await repository.purchaseOrder.getById(saleOrder.purchaseOrder);

      if (purchaseOrder) {
        purchaseOrder.status = data.status || purchaseOrder.status;
        const orderDetails = await InvoiceService.getOrderDetails(purchaseOrder.id);
        const pdf = InvoiceService.createInvoicePDF(orderDetails);
        purchaseOrder.invoicePDF = pdf;
        EmailService.sendInvoicePDFs(purchaseOrder);
        purchaseOrder.save();
      }

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
          attr.variation.map((attrItem) => {
            str += `${attrItem.name}: ${attrItem.value},`;
          });
          str += ')';
        }
        str += "', ";
        return str;
      }));
      message += ' were shipped.';

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
        await PushNotificationService.sendPushNotification({ message, device_ids: [buyer.device_id] });
      }
      return deliveryOrder;
    });
};