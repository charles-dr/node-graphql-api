const path = require('path');

const logger = require(path.resolve('config/logger'));
const { getPovider } = require(path.resolve('src/bundles/payment'));
const { TransactionAlreadyProcessedException } = require(path.resolve('src/bundles/payment/Exceptions'));
const repository = require(path.resolve('src/repository'));
const pubsub = require(path.resolve('config/pubsub'));
const ordersBundle = require(path.resolve('src/bundles/orders'));

module.exports = async (req, res) => {
  const { body, headers } = req;

  logger.debug(JSON.stringify(headers));
  logger.debug(JSON.stringify(body));

  const provider = getPovider('WireCard');
  const response = provider.createTransactionResponse(body);

  if (!response.isValid()) {
    return res.status(403).send('FORBIDDEN');
  }

  try {
    const transaction = await provider.processTransaction(response);
    pubsub.publish('PAYMENT_TRANSACTION_CHANGED', { id: transaction._id, ...transaction.toObject() });
    res.status(200).send('success');

    repository.purchaseOrder
      .findByTransactionId(transaction.id)
      .then((purchaseOrder) => (
        ordersBundle.executeOrderPaidFlow(purchaseOrder)
      ));
  } catch (error) {
    if (error instanceof TransactionAlreadyProcessedException) {
      logger.warn(`[PAYMENT][WIRECARD][WEBHOOK][${error.name}] "${error.message}"`);
      return res.status(200).send('Transaction already processed');
    }

    logger.error(`[PAYMENT][WIRECARD][WEBHOOK][${error.name}] "${error.message}" ${error.stack}`);
    return res.status(500).send('Internal Server Error');
  }
};
