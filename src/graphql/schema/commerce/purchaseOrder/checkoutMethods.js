const { UserInputError } = require('apollo-server');
const OrderFactory = require('./OrderFactory');

const createSaleOrders = async ({
  orderItems, deliveryOrders, cartItems, currency, buyerId, purchaseOrder,
}, repository) => {
  const saleOrderData = [];
  // group by using seller
  for (let i = 0; i < cartItems.length; i++) {
    const saleOrderItem = {
      seller: '',
      cartItems: [],
      orderItems: [],
      deliveryOrders: [],
    };
    saleOrderItem.seller = cartItems[i].product.seller;
    saleOrderItem.cartItems.push(cartItems[i]);
    saleOrderItem.orderItems.push(orderItems[i]);
    saleOrderItem.deliveryOrders.push(deliveryOrders[i]);
    for (let j = i + 1; j < cartItems.length; j++) {
      if (saleOrderItem.seller == cartItems[j].product.seller) {
        saleOrderItem.cartItems.push(cartItems[j]);
        saleOrderItem.orderItems.push(orderItems[j]);
        saleOrderItem.deliveryOrders.push(deliveryOrders[j]);
        cartItems.splice(j, 1);
        orderItems.splice(j, 1);
        deliveryOrders.splice(j, 1);
        j -= 1;
      }
    }
    saleOrderData.push(saleOrderItem);
  }

  saleOrderData.map(async (saleOrderItem) => {
    const factory = new OrderFactory(saleOrderItem.cartItems, currency);
    factory.setProperties(saleOrderItem.orderItems, saleOrderItem.deliveryOrders);
    const order = factory.createOrder();
    order.buyer = buyerId;
    order.deliveryOrders = saleOrderItem.deliveryOrders;
    order.items = saleOrderItem.orderItems.map((item) => item.id);
    order.seller = saleOrderItem.seller;
    order.purchaseOrder = purchaseOrder.id;
    order.total = saleOrderItem.orderItems.reduce((total, item) => total += item.price + item.deliveryPrice, 0);

    await repository.saleOrder.create(order);
  });
};

module.exports = {
  async validateDeliveryAddress(id, repository) {
    return repository.deliveryAddress.getById(id)
      .then((address) => {
        if (!address) {
          throw new UserInputError(`Delivery address "${id}" does not exist`, { invalidArgs: ['deliveryAddress'] });
        }

        if (!address.address.isDeliveryAvailable) {
          throw new UserInputError('Delivery address is not valid', { invalidArgs: ['deliveryAddress'] });
        }
      });
  },

  async loadCartAndValidate(userId, repository) {
    return repository.userCartItem.getItemsByUser(userId)
      .then(async (cartItems) => {
        if (!cartItems.length) {
          throw new UserInputError('User Cart is empty');
        }

        return Promise.all(cartItems.map(async (item) => {
          item.product = await repository.product.getById(item.product);
          item.deliveryRate = await repository.deliveryRate.getById(item.deliveryRate);
          if (!item.deliveryRate) {
            throw new UserInputError(`Cart item with id "${item.id}" does not have valid delivery rate`);
          }
          if (!item.billingAddress) {
            throw new UserInputError(`Cart item with id "${item.id}" does not have billing address!`);
          }
          if (item.productAttribute) {
            item.productAttribute = await repository.productAttributes.getById(item.productAttribute);
          }
          return item;
        }));
      });
  },

  async loadProductAsCart(deliveryRateId, productId, quantity, repository, billingAddress, note) {
    return Promise.all([
      repository.product.getById(productId),
      repository.deliveryRateCache.getById(deliveryRateId),
    ])
      .then(([product, deliveryRate]) => ([{
        product,
        deliveryRate,
        quantity,
        billingAddress,
        note,
      }]));
  },

  async loadProductAsCartByAttr(deliveryRateId, productId, quantity, repository, productAttributeId, billingAddress, note) {
    return Promise.all([
      repository.product.getById(productId),
      repository.productAttributes.getById(productAttributeId),
      repository.deliveryRateCache.getById(deliveryRateId),
    ])
      .then(([product, productAttribute, deliveryRate]) => ([{
        product,
        productAttribute,
        deliveryRate,
        quantity,
        billingAddress,
        note,
      }]));
  },

  async createOrder({
    cartItems, currency, buyerId, customCarrierPrice = 0,
  }, repository) {
    const factory = new OrderFactory(cartItems, currency, repository);

    const orderItems = await factory.createOrderItems()
      .then((items) => Promise.all(
        items.map((item) => repository.orderItem.create(item)),
      ));

    const deliveryOrders = await factory.createDeliveryOrders()
    .then((items) => Promise.all(
      items.map(async (item, index) => {
        if (item.deliveryAddress) {
          item.deliveryAddressInfo = await repository.deliveryAddress.getById(
            item.deliveryAddress
          );
        }
        return repository.deliveryOrder.create({ ...item, item: orderItems[index].id });
      }),
    ));

    const order = factory.createOrder(customCarrierPrice);
    order.buyer = buyerId;
    order.deliveryOrders = deliveryOrders;
    order.items = orderItems.map((item) => item.id);
    order.isPaid = false;

    // cartItems.map((item) => repository.productInventoryLog.decreaseQuantity(item.product._id, item.quantity));

    const purchaseOrder = await repository.purchaseOrder.create(order);
    await createSaleOrders({
      orderItems, deliveryOrders, cartItems, currency, buyerId, purchaseOrder,
    }, repository);
    return purchaseOrder;
  },

  async clearUserCart(userId, repository) {
    return repository.userCartItem.clear(userId, true);
  },
};
