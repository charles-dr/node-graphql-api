/**
 * @name: processTransaction
 * @description: post-process the successful payment transaction.
 * @summary:
 *  - update status -> SUCCESS, processedAt, responsePayload?
 */
const path = require('path');

const { TransactionAlreadyProcessedException, TransactionNotFoundException } = require('../Exceptions');
const { PaymentTransactionStatus } = require(path.resolve('src/lib/Enums'));

module.exports = (repository) => async ({ transaction, response }) => {
  if (!transaction) {
    throw new TransactionNotFoundException(`Payment Transaction id "${transaction.id}"`);
  }
  if (transaction.status !== PaymentTransactionStatus.PENDING) {
    throw new TransactionAlreadyProcessedException(`Payment Transaction id "${transaction.id}"`);
  }
  transaction.status = PaymentTransactionStatus.SUCCESS;
  transaction.processedAt = new Date();
  if (response) {
    transaction.responsePayload = typeof response === 'object' ? { ...response, ...(transaction.responsePayload || {}) } : { response };
  }
  return transaction.save();
}

