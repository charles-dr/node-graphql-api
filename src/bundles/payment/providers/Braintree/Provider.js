/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const path = require('path');
// const paypal = require('paypal-rest-sdk');
const { BraintreeGateway, Environment, Transaction } = require('braintree');
const { UserInputError } = require('apollo-server');

const ProviderAbstract = require('../ProviderAbstract');
const { PaymentException } = require('../../Exceptions');
const { response } = require('../../../../viewers');
const { domain, protocol } = require(path.resolve('config'));
const { error } = require('console');
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { PaymentTransactionStatus } = require(path.resolve('src/lib/Enums'));
const logger = require(path.resolve('config/logger'));

const TRANSACTION_SUCCESS_STATUSES = [
  Transaction.Status.Authorizing,
  Transaction.Status.Authorized,
  Transaction.Status.Settled,
  Transaction.Status.Settling,
  Transaction.Status.SettlementConfirmed,
  Transaction.Status.SettlementPending,
  Transaction.Status.SubmittedForSettlement,
];

class Provider extends ProviderAbstract {
  constructor(config, repository) {
    super();
    if (config.environment) {
      this.client = new BraintreeGateway({
        ...config,
        environment: Environment[config.environment[0].toUpperCase() + config.environment.slice(1)],
      });
    }
    this.repository = repository;
  }

  getName() {
    return 'Braintree';
  }

  getGQLSchema() {
    const input = `
          input ${this.getGQLInputName()} {
              token: String!
          }
      `;
    return input;
  }

  async generateToken(customerId = null) {
    return this.client.clientToken.generate({ customerId });
  }

  async createOrder(currency, amount, buyer, paymentMethodNonce) {
    // amount is in cents
    const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: amount, currency });
    if(!this.client) { console.log("BrainTree Connection Error !"); }
    return this.client.transaction.sale({
      amount: amountOfMoney.getCurrencyAmount(),
      paymentMethodNonce,
      options: { submitForSettlement: true },
    })
      .then(({
        success, transaction, errors, message
      }) => {
        if (success && TRANSACTION_SUCCESS_STATUSES.indexOf(transaction.status) !== -1) return transaction;
        return { error: message };
      })
      .catch((error) => ({ error: error.message }));
  }
}

module.exports = Provider;
