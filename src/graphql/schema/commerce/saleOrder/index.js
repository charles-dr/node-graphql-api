const path = require('path');
const { gql } = require('apollo-server');

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { SaleOrderStatus } = require(path.resolve('src/lib/Enums'));
const { InvoiceService } = require(path.resolve('src/lib/InvoiceService'));

const saleOrdersList = require('./resolvers/saleOrdersList');
const saleOrders = require('./resolvers/saleOrders');

const schema = gql`
    enum SaleOrderStatus {
        ${SaleOrderStatus.toGQL()}
    }

    type SaleOrder {
        id: ID!
        buyer: User!
        seller: User
        """ Collected status """
        status: SaleOrderStatus!
        """ List of products or services or anything else what we going to selling """
        items: [OrderProductItem!]!
        """ In Cents, Amount of money Shoclef will charge from Buyer"""
        price: AmountOfMoney!
        grossEarning: AmountOfMoney!
        deliveryPrice: AmountOfMoney!
        tax: AmountOfMoney!
        commissionFee: AmountOfMoney!
        sellerEarning: AmountOfMoney!
        total: AmountOfMoney!
        """ Address for ship products """
        deliveryOrders: [DeliveryOrder]!
        """ Relation to Payout """
        payout: PayoutOrder
        createdAt: Date
        purchaseOrder: PurchaseOrder!
        cancelationReason: String
    }

    type SaleOrderCollection {
        collection: [SaleOrder]!
        pager: Pager
    }

    input SaleOrderFilterInput {
      statuses: [SaleOrderStatus!]
      purchaseOrder: ID
    }

    extend type Query {
      saleOrdersList(filter: SaleOrderFilterInput = {}, page: PageInput = {}): SaleOrderCollection!
      """Allows: authorized user"""
      saleOrders(filter: SaleOrderFilterInput = {}, page: PageInput = {}): SaleOrderCollection! @auth(requires: USER)
      """Allows: authorized user"""
      saleOrder(id: ID!): SaleOrder
      getPackingSlip(id: ID!): String
    }

    extend type Mutation {
        # """Allows: authorized user"""
        # deliverySaleOrder(id: ID, carrier: Carrier!, trackCode: String!): SaleOrder! @auth(requires: USER)
        """Allows: authorized user"""
        cancelSaleOrder(id: ID!, reason: String!): SaleOrder! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    saleOrder: async (_, { id }, { dataSources: { repository } }) => (
      repository.saleOrder.getById(id)
    ),
    saleOrders,
    saleOrdersList,
    getPackingSlip: (_, { id }, { dataSources: { repository } }) => repository.saleOrder.getPackingSlip(id)
      .then((orders) => {
        if (orders && orders.length > 0) { return orders; }

        return InvoiceService.getSalesOrderDetails(id)
          .then(async (orderDetails) => InvoiceService.createPackingSlip(orderDetails))
          .catch((err) => {
            throw new Error(err.message);
          });
      }),
  },
  SaleOrder: {
    buyer: async (order, _, { dataSources: { repository } }) => (
      repository.user.getById(order.buyer)
    ),
    seller: async (order, _, { dataSources: { repository } }) => (
      repository.user.getById(order.seller)
    ),
    items: async (order, _, { dataSources: { repository } }) => (
      repository.orderItem.getByIds(order.items)
    ),
    deliveryOrders: async (order, _, { dataSources: { repository } }) => (
      repository.deliveryOrder.getByIds(order.deliveryOrders)
    ),
    purchaseOrder: async (order, _, { dataSources: { repository } }) => (
      repository.purchaseOrder.getById(order.purchaseOrder)
    ),
    total: async (order) => (
      CurrencyFactory.getAmountOfMoney({
        centsAmount: order.total,
        currency: order.currency,
      })
    ),
    price: async (order) => (
      CurrencyFactory.getAmountOfMoney({
        centsAmount: order.price,
        currency: order.currency,
      })
    ),
    deliveryPrice: async (order) => (
      CurrencyFactory.getAmountOfMoney({
        centsAmount: order.deliveryPrice,
        currency: order.currency,
      })
    ),
    tax: async (order) => (
      CurrencyFactory.getAmountOfMoney({
        centsAmount: 0,
        currency: order.currency,
      })
    ),
    grossEarning: async (order) => (
      CurrencyFactory.getAmountOfMoney({
        centsAmount: order.price + order.deliveryPrice,
        currency: order.currency,
      })
    ),
    commissionFee: async (order, _, { dataSources: { repository } }) => {
      const serviceFee = await repository.user.getById(order.seller)
        .then((seller) => (order.price + order.deliveryPrice) * seller.fee);

      return CurrencyFactory.getAmountOfMoney({
        centsAmount: Math.floor(serviceFee),
        currency: order.currency,
      });
    },
    sellerEarning: async (order, _, { dataSources: { repository } }) => {
      const earning = await repository.user.getById(order.seller)
        .then((seller) => (order.price + order.deliveryPrice) * (1 - seller.fee));

      return CurrencyFactory.getAmountOfMoney({
        centsAmount: Math.floor(earning),
        currency: order.currency,
      });
    },
  },
};
