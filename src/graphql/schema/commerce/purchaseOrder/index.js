const path = require('path');
const { gql } = require('apollo-server');

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { InvoiceService } = require(path.resolve('src/lib/InvoiceService'));

const checkoutCart = require('./resolvers/checkoutCart');
const checkoutOneProduct = require('./resolvers/checkoutOneProduct');
const payPurchaseOrder = require('./resolvers/payPurchaseOrder');
const purchaseOrders = require('./resolvers/purchaseOrders');
const getBrainTreeToken = require('./resolvers/getBrainTreeToken');
const invoiceService = require('../../../../bundles/invoice');
const orderList = require('./resolvers/orderList');
const purchaseOrderListByProduct = require('./resolvers/purchaseOrderListByProduct');

const { PaymentMethodProviders } = require(path.resolve('src/lib/Enums'));
const { PurchaseOrderStatus } = require(path.resolve('src/lib/Enums'));
const LinePayConfirm = require(path.resolve('src/bundles/payment/providers/LinePay/LinePayConfirm'));

const schema = gql`
  enum PurchaseOrderStatus {
    ${PurchaseOrderStatus.toGQL()}
  }

  enum PaymentMethodProviders {
    ${PaymentMethodProviders.toGQL()}
  }

  """ Orders for Buyer """
  type PurchaseOrder {
    id: ID!
    isPaid: Boolean!
    """ Collected status """
    status: PurchaseOrderStatus!
    """ List of products or services or anything else what we going to selling """
    #items: [OrderItemInterface!]! # old way
    items: [OrderProductItem!]!
    """ In Cents, Amount of money Shoclef will charge from Buyer"""
    price(currency: Currency): AmountOfMoney!
    """ In Cents, Amount of money Shoclef will charge from Buyer"""
    deliveryPrice(currency: Currency): AmountOfMoney!
    """ In Cents, Amount of money Shoclef will charge from Buyer"""
    total(currency: Currency): AmountOfMoney!
    tax(currency: Currency): AmountOfMoney!
    """ In future buyer will be able to pay by few paymnets to one Order"""
    payments: [PaymentTransactionInterface!]
    """ Address for ship products """
    deliveryOrders: [DeliveryOrder]
    cancelationReason: String
    error: String
    publishableKey: String
    paymentClientSecret: String
    buyer: User!
    createdAt: Date!
    paymentInfo: String
  }

  type PurchaseOrderCollection {
    collection: [PurchaseOrder]!
    pager: Pager
  }

  type ConfirmMessage {
    message: String!
  }

  enum OrderSortFeature {
    CREATED_AT
  }

  input OrderSortInput {
    feature: OrderSortFeature! = CREATED_AT,
    type: SortTypeEnum! = ASC
  }

  input PurchaseOrderFilterInput {
    statuses: [PurchaseOrderStatus!]
    isPaid: Boolean
    searchQuery: String
  }

  input RedirectionInput {
    success: String!
    cancel: String
  }

  enum PurchaseOrderSortFeature {
    CREATED_AT
  }

  input PurcahseOrderSortInput {
    feature: ReviewSortFeature! = CREATED_AT
    type: SortTypeEnum! = DESC
  }

  extend type Query {
    allPurchaseOrders: [PurchaseOrder]!
    purchaseOrders(filter: PurchaseOrderFilterInput = {}, sort: PurcahseOrderSortInput = {}, page: PageInput = {}): PurchaseOrderCollection!  @auth(requires: USER)
    purchaseOrder(id: ID!): PurchaseOrder
    productReview(id:ID!):Review
    orderList(
      filter: PurchaseOrderFilterInput = {}, 
      page: PageInput = {},
      sort: OrderSortInput = {}
    ): PurchaseOrderCollection!
    purchaseOrderListByProduct(productID: ID!): [PurchaseOrder]!
    getInvoicePDF(id: ID!): String
  }

  extend type Mutation {
    """
      - Allows: authorized user
      - param.redirection: requires only for PayPal
    """
    checkoutCart(
      currency: Currency!, 
      provider: PaymentMethodProviders!,
      customCarrierPrice: Float,
      """Required only for PayPal & UnionPay"""
      redirection: RedirectionInput, 
      """Required only for Braintree"""
      paymentMethodNonce: String
    ): PurchaseOrder! @auth(requires: USER)

    """
      - Allows: authorized user
      - redirection: required for PayPal or UnionPay
    """
    checkoutOneProduct(
      deliveryRate: ID!, 
      product: ID!, 
      quantity: Int!, 
      currency: Currency!, 
      productAttribute: ID, 
      provider: PaymentMethodProviders!,
      billingAddress: ID!,
      redirection: RedirectionInput
      """Required for Braintree only"""
      paymentMethodNonce: String
    ): PurchaseOrder! @auth(requires: USER)

    """Allows: authorized user"""
    cancelPurchaseOrder(id: ID!, reason: String!): PurchaseOrder! @auth(requires: USER)

    """Allows: authorized user"""
    LinePayConfirm(transactionID: String!, amount: Float!, currency: Currency!): ConfirmMessage! @auth(requires: USER)

    """
    Allows: authorized user
    Pass ID of the Order you want to pay
    """
    payPurchaseOrder(id: ID!, paymentMethod: ID): PaymentTransactionInterface! @auth(requires: USER)
    getBrainTreeToken: String! @auth(requires: USER)
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    allPurchaseOrders: async (_, __, { dataSources: { repository }, user }) => (
      repository.purchaseOrder.find({ user })
        .then((collection) => (collection || []))
    ),
    purchaseOrder: async (_, { id }, { dataSources: { repository } }) => (
      repository.purchaseOrder.getById(id)
    ),
    productReview: async (_, { id }, { dataSources: { repository }, user }) => (
      repository.rating.getByProduct(id, user)
    ),
    purchaseOrders,
    orderList,
    purchaseOrderListByProduct,
    getInvoicePDF: async (_, { id }, { dataSources: { repository } }) => repository.purchaseOrder.getInvoicePDF(id)
      .then((pdf) => {
        if (pdf && pdf.length > 0) {
          return pdf;
        }
        console.log("it is going to create invoice")
        return InvoiceService.getOrderDetails(id)
          .then(async (orderDetails) => InvoiceService.createInvoicePDF(orderDetails))
          .catch((err) => {
            throw new Error(err.message);
          });
      }),
  },
  Mutation: {
    checkoutCart,
    checkoutOneProduct,
    payPurchaseOrder,
    LinePayConfirm,
    getBrainTreeToken,
  },
  PurchaseOrder: {
    items: async (order, _, { dataSources: { repository } }) => (
      repository.orderItem.getByIds(order.items)
    ),
    payments: async (order, _, { dataSources: { repository } }) => (
      repository.paymentTransaction.getByIds(order.payments)
    ),
    deliveryOrders: async (order, _, { dataSources: { repository } }) => (
      repository.deliveryOrder.getByIds(order.deliveryOrders)
    ),
    price: async ({ price, currency }, args) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: price, currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
    deliveryPrice: async ({ deliveryPrice, currency }, args) => {
      // eslint-disable-next-line max-len
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: deliveryPrice, currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
    tax: async ({ tax, currency }, args) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: tax, currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
    total: async ({ total, currency }, args) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: total, currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
    buyer: async (order, _, { dataSources: { repository } }) => (
      repository.user.getById(order.buyer)
    ),
    createdAt: (order) => new Date(order.createdAt).toDateString(),
  },
};
