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
  capturePayment: async ({ paymentId, execute_details }) => new Promise((resolve, reject) => {
    paypal.payment.execute(paymentId, execute_details, (error, capture) => {
      if (error) {
        reject(error);
      } else {
        resolve(capture);
      }
    });
  }),
  paymentCreated: async (data, repository) => {
    const _self = activity;
    const paymentId = data.id;
    const execute_details = {
      payer_id: data.payer.payer_info.payer_id,
      transactions: data.transactions.map((tx) => ({ amount: tx.amount })),
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
        } if (error instanceof TransactionNotFoundException) {
          return { code: 404, message: `${error.message} not found!` };
        }
        return { code: 400, message: error.message };
      });
  },
};

module.exports = async (req, res) => {
  // res.status(200).send(req.body);
  const params = req.query;
  console.log('alipay ', req.body, params);
  const transactionId = params.out_trade_no;
  let currentTransaction;

  return repository.paymentTransaction.getById(transactionId)
    // if provider needs own transactionProcesser, use it.
    .then((transaction) => {
      currentTransaction = transaction;
      return processTransaction(repository)({ transaction, response: params });
    })
    .then((transaction) => {
      const purchaseOrderId = transaction.tags[0].replace(
        'PurchaseOrder:',
        '',
      );
      return repository.purchaseOrder.getById(purchaseOrderId);
    })
    .then((purchaseOrder) => ordersBundle.executeOrderPaidFlow(purchaseOrder))
    .then(async (purchaseOrder) => {
      // do some extra process.
      pubsub.publish('PAYMENT_TRANSACTION_CHANGED', {
        id: currentTransaction._id,
        ...currentTransaction.toObject(),
      });
      await checkout.clearUserCart(purchaseOrder.buyer, repository);
      EmailService.sendInvoicePDFs(purchaseOrder);
      EmailService.sendPackingSlipPDFs(purchaseOrder);
      // decrease quantity of product.

      return res.send({ code: 200, message: 'Success', transaction: currentTransaction });
    })
    .catch((error) => {
      if (error instanceof TransactionAlreadyProcessedException) {
        return res.send({
          code: 200,
          message: `${error.message} already processed!`,
          transaction: currentTransaction,
        });
      } if (error instanceof TransactionNotFoundException) {
        return res.send({ code: 404, message: `${error.message} not found!` });
      }
      return res.send({ code: 400, message: error.message });
    });
};
