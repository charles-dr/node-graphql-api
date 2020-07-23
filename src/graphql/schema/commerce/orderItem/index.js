const path = require('path');
const { gql } = require('apollo-server');

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { OrderItemStatus } = require(path.resolve('src/lib/Enums'));

const schema = gql`
    enum OrderItemStatus {
        ${OrderItemStatus.toGQL()}
    }

    type OrderItemLog {
        id: ID!
        date: Date!
        oldStatus: OrderItemStatus!
        newStatus: OrderItemStatus!
        whoChanged: User!
        tags: [String!]
    }

    interface OrderItemInterface {
        id: ID!
        title: String!
        status: OrderItemStatus!
        """ In Units """
        quantity: Int!
        price(currency: Currency): AmountOfMoney!
        deliveryPrice(currency: Currency): AmountOfMoney!
        subtotal(currency: Currency): AmountOfMoney!
        total(currency: Currency): AmountOfMoney!
        seller: User!
        deliveryOrder: DeliveryOrder
        log: OrderItemLog!
        billingAddress: DeliveryAddress!
        note: String
    }

    type OrderProductItem implements OrderItemInterface {
        id: ID!
        title: String!
        product: Product
        productAttribute: ProductAttribute
        """ In Units """
        quantity: Int!
        price(currency: Currency): AmountOfMoney!
        deliveryPrice(currency: Currency): AmountOfMoney!
        subtotal(currency: Currency): AmountOfMoney!
        total(currency: Currency): AmountOfMoney!
        seller: User!
        status: OrderItemStatus!
        deliveryOrder: DeliveryOrder
        log: OrderItemLog!
        billingAddress: DeliveryAddress!
        note: String
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  OrderProductItem: {
    seller: async (item, _, { dataSources: { repository } }) => (
      repository.user.getById(item.seller)
    ),
    price: async ({ price, currency }, args) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: price, currency: currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
    deliveryPrice: async ({ deliveryPrice, currency }, args) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: deliveryPrice, currency: currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
    subtotal: async ({ total, currency }, args) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: total, currency: currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
    total: async ({ total, deliveryPrice, currency }, args) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: total + deliveryPrice, currency: currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
    product: async (item, _, { dataSources: { repository } }) => (
      repository.product.getById(item.product)
    ),
    productAttribute: async (item, _, { dataSources: { repository } }) => (
      repository.productAttributes.getById(item.productAttribute)
    ),
    deliveryOrder: async (item, _, { dataSources: { repository } }) => (
      repository.deliveryOrder.findByOrderItem(item.id)
    ),
    billingAddress: async (item, _, { dataSources: { repository } }) => repository.billingAddress.getById(item.billingAddress),
  },
  OrderItemInterface: {
    __resolveType(item) {
      if (item.product) {
        return 'OrderProductItem';
      }

      return null;
    },
  },
};
