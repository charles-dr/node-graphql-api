/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const path = require('path');

const ProviderAbstract = require('../ProviderAbstract');
const TransactionResponse = require('./TransactionResponse');
const TransactionRequest = require('./TransactionRequest');
const { TransactionAlreadyProcessedException, TransactionSignatureFailedException, TransactionNotFoundException } = require('../../Exceptions');

const { PaymentTransactionStatus } = require(path.resolve('src/lib/Enums'));


class Provider extends ProviderAbstract {
  constructor({ entrypoint, merchantId, secret }, repository) {
    super();
    this.entrypoint = entrypoint;
    this.merchantId = merchantId;
    this.secret = secret;
    this.repository = repository;
  }

  getMerchantId() {
    return this.merchantId;
  }

  getName() {
    return 'WireCard';
  }

  getGQLSchema() {
    const input = `
          input ${this.getGQLInputName()} {
            """This is not working yet"""
            notImplementedYet: String!
          }
      `;

    return input;
  }

  async addMethod() {
    return null;
  }

  createTransactionRequest(data) {
    return new TransactionRequest({ ...data, merchantId: this.merchantId, secret: this.secret });
  }

  createTransactionResponse(data) {
    return new TransactionResponse({ ...data, merchantId: this.merchantId, secret: this.secret });
  }

  /**
   * @param {TransactionResponse} response
   */
  async processTransaction(response) {
    if (!response.isValid()) {
      throw new TransactionSignatureFailedException('Response is not valid');
    }

    const transactionId = response.getTransactionId();
    return this.repository.paymentTransaction.getById(transactionId)
      .then((transaction) => {
        if (!transaction) {
          throw new TransactionNotFoundException(`Payment Transaction id "${transactionId}"`);
        }

        if (transaction.status !== PaymentTransactionStatus.PENDING) {
          throw new TransactionAlreadyProcessedException(`Payment Transaction id "${transactionId}"`);
        }

        transaction.status = response.getStatus();
        transaction.processedAt = response.getDate();
        transaction.responsePayload = JSON.stringify(response.data);
        transaction.providerTransactionId = response.getProviderTransactionId();

        return transaction.save();
      });
  }
}

module.exports = Provider;
