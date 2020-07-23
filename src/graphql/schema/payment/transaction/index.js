const path = require('path');
const { gql, withFilter } = require('apollo-server');

const { baseURL } = require(path.resolve('config'));

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { PaymentTransactionStatus } = require(path.resolve('src/lib/Enums'));
const pubsub = require(path.resolve('config/pubsub'));

const schema = gql`
    enum PaymentTransactionStatus {
        ${PaymentTransactionStatus.toGQL()}
    }

    type PaymentNotification {
      format: String!
      url: String!
    }

    interface PaymentTransactionInterface {
      id: ID!
      createdAt: Date!
      amount(currency: Currency): AmountOfMoney!
      status: PaymentTransactionStatus!
      processedAt: Date
      tags: [String!]
    }

    type WireCardTransaction implements PaymentTransactionInterface {
      id: ID!
      createdAt: Date!
      type: String!
      amount(currency: Currency): AmountOfMoney!
      status: PaymentTransactionStatus!
      processedAt: Date
      tags: [String!]
      merchant: ID!
      signature: String!
      notification: PaymentNotification!
    }

    type PaymentTransaction implements PaymentTransactionInterface {
      id: ID!
      createdAt: Date!
      amount(currency: Currency): AmountOfMoney!
      status: PaymentTransactionStatus!
      processedAt: Date
      tags: [String!]
      paymentMethod: PaymentMethod!
    }

    extend type Subscription {
      paymentTransactionProcessed(id: ID!): PaymentTransactionInterface! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Subscription: {
    paymentTransactionProcessed: {
      resolve: (payload) => payload,
      subscribe: withFilter(
        () => pubsub.asyncIterator(['PAYMENT_TRANSACTION_CHANGED']),
        (payload, variables) => payload.id === variables.id,
      ),
    },
  },
  PaymentTransactionInterface: {
    __resolveType(item) {
      if (item.merchant) {
        return 'WireCardTransaction';
      }
      return 'PaymentTransaction';
    },
  },
  PaymentTransaction: {
    paymentMethod: async (transaction, _, { dataSources: { repository } }) => (
      repository.paymentMethod.getById(transaction.paymentMethod)
    ),
    amount: async ({ amount, currency }, args) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: amount, currency: currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
  },
  WireCardTransaction: {
    notification: () => ({
      format: 'application/x-www-form-urlencoded',
      url: `${baseURL}webhooks/payment/wirecard`,
    }),
    amount: async ({ amount, currency }, args) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: amount, currency: currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
  },
};
