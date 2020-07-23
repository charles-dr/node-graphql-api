const path = require('path');

const { PurchaseOrderStatus, OrderItemStatus, DeliveryOrderStatus } = require(path.resolve('src/lib/Enums'));

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));

async function createOrderItem(cartItem, currency, repository) {
  let price = CurrencyFactory.getAmountOfMoney({
    centsAmount: cartItem.productAttribute ? cartItem.productAttribute.price : cartItem.product.price,
    currency: cartItem.productAttribute ? cartItem.productAttribute.currency : cartItem.product.currency,
  });

  let deliveryPrice = CurrencyFactory.getAmountOfMoney({
    centsAmount: cartItem.deliveryRate.amount,
    currency: cartItem.deliveryRate.currency,
  });

  if (price.currency !== currency) {
    price = await CurrencyService.exchange(price, currency);
  }

  if (deliveryPrice.currency !== currency) {
    deliveryPrice = await CurrencyService.exchange(deliveryPrice, currency);
  }

  const seller = await repository.user.getById(cartItem.product.seller);

  return {
    status: OrderItemStatus.CREATED,
    createdAt: new Date(),
    product: cartItem.product,
    productAttribute: cartItem.productAttribute,
    quantity: cartItem.quantity,
    originCurrency: cartItem.productAttribute ? cartItem.productAttribute.currency : cartItem.product.currency,
    originPrice: cartItem.productAttribute ? cartItem.productAttribute.price : cartItem.product.price,
    originDeliveryCurrency: cartItem.deliveryRate.currency,
    originDeliveryPrice: cartItem.deliveryRate.amount,
    currency,
    price: price.getCentsAmount(),
    deliveryPrice: deliveryPrice.getCentsAmount() * cartItem.quantity,
    total: price.getCentsAmount() * cartItem.quantity,
    seller: cartItem.product.seller,
    title: cartItem.product.title,
    billingAddress: cartItem.billingAddress,
    note: cartItem.note,
  };
}

async function createDeliveryOrder(cartItem, currency) {
  let deliveryPrice = CurrencyFactory.getAmountOfMoney({
    centsAmount: cartItem.deliveryRate.amount,
    currency: cartItem.deliveryRate.currency,
  });

  if (deliveryPrice.currency !== currency) {
    deliveryPrice = await CurrencyService.exchange(deliveryPrice, currency);
  }

  return {
    status: DeliveryOrderStatus.CREATED,
    createdAt: new Date(),
    seller: cartItem.product.seller,
    rate_id: cartItem.deliveryRate.rate_id,
    estimatedDeliveryDate: cartItem.deliveryRate.estimatedDeliveryDate,
    currency,
    carrier: cartItem.deliveryRate.carrier,
    deliveryAddress: cartItem.deliveryRate.deliveryAddress,
    deliveryPrice: deliveryPrice.getCentsAmount(),
  };
}


class OrderFactory {
  constructor(cartItems, currency, repository) {
    this.cartItems = cartItems;
    this.currency = currency;
    this.purchaseItems = null;
    this.deliveryOrders = null;
    this.purchaseOrder = null;
    this.repository = repository;
  }

  setProperties(orderItems, deliveryOrders) {
    this.purchaseItems = orderItems;
    this.deliveryOrders = deliveryOrders;
  }

  async createOrderItems() {
    return Promise.all(
      this.cartItems.map((cartItem) => createOrderItem(cartItem, this.currency, this.repository)),
    )
      .then((purchaseItems) => {
        this.purchaseItems = purchaseItems;
        return purchaseItems;
      });
  }

  async createDeliveryOrders() {
    return Promise.all(
      this.cartItems.map((cartItem) => createDeliveryOrder(cartItem, this.currency)),
    )
      .then((deliveryOrders) => {
        this.deliveryOrders = deliveryOrders;
        return deliveryOrders;
      });
  }

  createOrder(customCarrierPrice) {
    const order = {
      currency: this.currency,
      status: PurchaseOrderStatus.CREATED,
      quantity: this.purchaseItems.reduce((sum, item) => sum + item.quantity, 0),
      price: this.purchaseItems.reduce((sum, item) => sum + item.total, 0),
      deliveryPrice: this.purchaseItems.reduce((sum, item) => sum + item.deliveryPrice, 0),
      total: this.purchaseItems.reduce((sum, item) => sum + item.total + item.deliveryPrice, 0) + customCarrierPrice,
      tax: 0,
      customCarrierPrice
    };

    return order;
  }
}

module.exports = OrderFactory;
