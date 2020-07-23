const path = require('path');
const logger = require(path.resolve('config/logger'));
const repository = require(path.resolve('src/repository'));
const { payment } = require(path.resolve('config'));
const stripe = require('stripe')(payment.providers.stripe.secret);

const checkout = require(path.resolve('src/graphql/schema/commerce/purchaseOrder/checkoutMethods'));
const processTransaction = require(path.resolve('src/bundles/payment/actions/processTransaction'));
const ordersBundle = require(path.resolve('src/bundles/orders'));
const { PurchaseOrderStatus } = require(path.resolve('src/lib/Enums'));
const { TransactionAlreadyProcessedException, TransactionNotFoundException } = require(path.resolve('src/bundles/payment/Exceptions'));
const pubsub = require(path.resolve('config/pubsub'));
const { EmailService } = require(path.resolve('src/bundles/email'));


const activity = {
  getPaymentInfo: (paymentMethod) => {
    let paymentInfo;
    switch (paymentMethod.type) {
      case 'card':
        paymentInfo = `${paymentMethod.card.brand.toUpperCase()} Card Ending in ${paymentMethod.card.last4}`;
        break;
      case 'alipay':
        paymentInfo = 'Alipay Payment Method';
        break;
      case 'au_becs_debit':
        paymentInfo = `Bank Account Ending in ${paymentMethod.au_becs_debit.last4}`;
        break;
      case 'bacs_debit':
        paymentInfo = `Bacs Direct Debit Bank Account Ending in ${paymentMethod.bacs_debit.last4}`;
        break;
      case 'bancontact':
        paymentInfo = 'Bancontact Payment Method';
        break;
      case 'eps':
        paymentInfo = 'EPS Payment Method';
        break;
      case 'fpx':
        paymentInfo = 'FPX Payment Method';
        break;
      case 'giropay':
        paymentInfo = 'Giropay payment method';
        break;
      case 'ideal':
        paymentInfo = 'iDEAL Payment Method';
        break;
      case 'interac_present':
        paymentInfo = 'Interac Present Payment Method';
        break;
      case 'oxxo':
        paymentInfo = 'OXXO Payment Method';
        break;
      case 'p24':
        paymentInfo = 'P24 Payment Method';
        break;
      case 'sepa_debit':
        paymentInfo = `SEPA Debit Bank Account Ending in ${paymentMethod.sepa_debit.last4}`;
        break;
      case 'sofort ':
        paymentInfo = 'SOFORT Payment Method';
        break;
      default:
        break;
    }
    return paymentInfo;
  },
}


module.exports = async (req, res) => {
  let data; let eventType;

  data = req.body.data;
  eventType = req.body.type;

  if (eventType === 'payment_intent.succeeded') {
    // Funds have been captured
    // Fulfill any orders, e-mail receipts, etc
    // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds)
    console.log('💰 Payment captured!');
    const { customer, id: pid } = data.object;

    const paymentIntent = await stripe.paymentIntents.retrieve(pid);
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);
    const paymentInfo = activity.getPaymentInfo(paymentMethod);

    await repository.purchaseOrder.addPaymentInfo(paymentIntent.client_secret, paymentInfo);
    await repository.purchaseOrder.updateStatusByClientSecret(paymentIntent.client_secret, PurchaseOrderStatus.ORDERED);

    let currentTransaction;
    return repository.paymentTransaction.getByProviderTransactionId(pid)
      .then(transaction => processTransaction(repository)({ transaction, response: data.object }))
      .then(transaction => {
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

        return res.status(200).send('Success');
      })
      .catch(error => {
        if (error instanceof TransactionAlreadyProcessedException) {
          return res.status(200).send(`${error.message} already processed!`);
        } else if (error instanceof TransactionNotFoundException) {
          return res.status(404).send(`${error.message} not found!`);
        } else {
          return res.status(400).send(error.message);
        }
      })

  } else if (eventType === 'payment_intent.canceled' || eventType === 'payment_intent.payment_failed') {
    const pID = data.object.id;
    const { customer } = data.object;
    await stripe.paymentIntents.cancel(pID)
      .then(async () => {
        const user = await repository.paymentStripeCustomer.getByCustomerID(customer);
        // await checkout.clearUserCart(user.user, repository); // no need to clear cart after failed payment. buyer should try again.
      }).catch((error) => console.log(error.message));
  }

  const { object } = data;
  if (
    object.object === 'source'
        && object.status === 'chargeable'
        && object.metadata.paymentIntent
  ) {
    const source = object;
    const paymentIntent = await stripe.paymentIntents.retrieve(
      source.metadata.paymentIntent,
    );
    await stripe.paymentIntents.confirm(paymentIntent.id, { source: source.id });
  }

  res.sendStatus(200);
};
