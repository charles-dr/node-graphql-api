const path = require("path");
const logger = require(path.resolve("config/logger"));
const repository = require(path.resolve("src/repository"));
const { payment } = require(path.resolve("config"));
const paypal = require("paypal-rest-sdk");
paypal.configure(payment.providers.paypal);

const checkout = require(path.resolve(
  "src/graphql/schema/commerce/purchaseOrder/checkoutMethods"
));
const processTransaction = require(path.resolve(
  "src/bundles/payment/actions/processTransaction"
));
const ordersBundle = require(path.resolve("src/bundles/orders"));
const {
  TransactionAlreadyProcessedException,
  TransactionNotFoundException,
} = require(path.resolve("src/bundles/payment/Exceptions"));
const pubsub = require(path.resolve("config/pubsub"));
const { EmailService } = require(path.resolve("src/bundles/email"));

const activity = {
  paymentCreated: async (data, repository) => {
    const txnIdentifier = `${data.orderId}:${data.txnTime}`;
    let currentTransaction;

    return repository.paymentTransaction.getByProviderTransactionId(txnIdentifier)
      // if provider needs own transactionProcesser, use it.
      .then((transaction) => {
        currentTransaction = transaction;
        return processTransaction(repository)({ transaction, response: data })
      })
      .then((transaction) => {
        const purchaseOrderId = transaction.tags[0].replace(
          "PurchaseOrder:",
          ""
        );
        return repository.purchaseOrder.getById(purchaseOrderId);
      })
      .then((purchaseOrder) =>
        ordersBundle.executeOrderPaidFlow(purchaseOrder)
      )
      .then(async (purchaseOrder) => {
        // do some extra process.
        pubsub.publish("PAYMENT_TRANSACTION_CHANGED", {
          id: currentTransaction._id,
          ...currentTransaction.toObject(),
        });
        await checkout.clearUserCart(purchaseOrder.buyer, repository);
        EmailService.sendInvoicePDFs(purchaseOrder);
        EmailService.sendPackingSlipPDFs(purchaseOrder);
        // decrease quantity of product.

        return { code: 200, message: "Success", transaction: currentTransaction };
      })
      .catch((error) => {
        if (error instanceof TransactionAlreadyProcessedException) {
          return {
            code: 200,
            message: `${error.message} already processed!`,
            transaction: currentTransaction
          };
        } else if (error instanceof TransactionNotFoundException) {
          return { code: 404, message: `${error.message} not found!` };
        } else {
          return { code: 400, message: error.message };
        }
      })
  },
};

module.exports = async (data) => {
  logger.info(`[WEBHOOK][UNIONPAY][PROCESSING] ${data.orderId}`);
  return activity.paymentCreated(data, repository);
};
