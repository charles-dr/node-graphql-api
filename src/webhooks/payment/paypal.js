const path = require('path');
const logger = require(path.resolve('config/logger'));
const repository = require(path.resolve('src/repository'));
const { payment } = require(path.resolve('config'));
const paypal = require('paypal-rest-sdk');
paypal.configure(payment.providers.paypal);

const checkout = require(path.resolve('src/graphql/schema/commerce/purchaseOrder/checkoutMethods'));
const processTransaction = require(path.resolve('src/bundles/payment/actions/processTransaction'));
const ordersBundle = require(path.resolve('src/bundles/orders'));
const { TransactionAlreadyProcessedException, TransactionNotFoundException } = require(path.resolve('src/bundles/payment/Exceptions'));
const pubsub = require(path.resolve('config/pubsub'));
const { EmailService } = require(path.resolve('src/bundles/email'));


const activity = {
  capturePayment: async ({ paymentId, execute_details }) => {
    return new Promise((resolve, reject) => {
      paypal.payment.execute(paymentId, execute_details, function (error, capture) {
        if (error) {
            reject(error);
        } else {
            resolve(capture);
        }
      });      
    })
  },
  paymentCreated: async (data, repository) => {
    const _self = activity;
    const paymentId = data.id;
    const execute_details = {
      payer_id: data.payer.payer_info.payer_id,
      transactions: data.transactions.map(tx => ({amount: tx.amount}))
    };
    let currentTransaction;
    return _self.capturePayment({ paymentId, execute_details })
      .then(() => {
        console.log('💰 Payment captured!');
        return repository.paymentTransaction.getByProviderTransactionId(paymentId);
      })
      // if provider needs own transactionProcesser, use it.
      .then((transaction) => processTransaction(repository)({ transaction, response: null }))
      .then((transaction) => {
        currentTransaction = transaction;
        const purchaseOrderId = transaction.tags[0].replace('PurchaseOrder:', '');
        return repository.purchaseOrder.getById(purchaseOrderId);
      })
      .then((purchaseOrder) => ordersBundle.executeOrderPaidFlow(purchaseOrder))
      .then(async (purchaseOrder) => {
        // do some extra process.
        pubsub.publish('PAYMENT_TRANSACTION_CHANGED', { id: currentTransaction._id, ...currentTransaction.toObject() });
        await checkout.clearUserCart(purchaseOrder.buyer, repository);
        EmailService.sendInvoicePDFs(purchaseOrder);
        EmailService.sendPackingSlipPDFs(purchaseOrder);
        // decrease quantity of product.

        return { code: 200, message: 'Success' };
      })
      .catch((error) => {
        if (error instanceof TransactionAlreadyProcessedException) {
          return { code: 200, message: `${error.message} already processed!` };
        } else if (error instanceof TransactionNotFoundException) {
          return { code: 404, message: `${error.message} not found!` };
        } else {
          return { code: 400, message: error.message };
        }
      })
  }
};

module.exports = async (req, res) => {
  const data = req.body.resource;
  const eventType = req.body.event_type;

  switch (eventType) {
    case 'PAYMENTS.PAYMENT.CREATED':
      return activity.paymentCreated(data, repository)
        .then(({ message, code }) => {
          logger.info(`[WEBHOOK][PAYPAL][PAYMENTS.PAYMENT.CREATED] ${code}:${message}`);
          return res.status(code).send(message)
        });
      break;
    case "PAYMENT.SALE.COMPLETED":
      logger.info('[WEBHOOK][PAYPAL][PAYMENT.SALE.COMPLETED] 200:Got it!');
      res.status(200).send('Got it!');
      break;
    default: 
      res.sendStatus(200);
  }
};
