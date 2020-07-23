const path = require("path");
const uuid = require("uuid/v4");

const { CurrencyFactory } = require(path.resolve("src/lib/CurrencyFactory"));
const ordersBundle = require(path.resolve("src/bundles/orders"));
const repository = require(path.resolve("src/repository"));
const { PaymentMethodIsUnactiveException, PaymentMethodUsesWrongProviderException } = require("../Exceptions");

const { PaymentTransactionStatus } = require(path.resolve("src/lib/Enums"));
const { PaymentMethodProviders } = require(path.resolve("src/lib/Enums"));
const logger = require(path.resolve("config/logger"));
const { payment: { providers: { stripe } } } = require(path.resolve("config"));

const stripeProvider = PaymentMethodProviders.STRIPE;
const alipayProvider = PaymentMethodProviders.ALIPAY;
const razorpayProvider = PaymentMethodProviders.RAZORPAY;
const paypalProvider = PaymentMethodProviders.PAYPAL;
const linepayProvider = PaymentMethodProviders.LINEPAY;
const braintreeProvider = PaymentMethodProviders.BRAINTREE;

function paymentTransactionFactory(order) {
  return {
    _id: uuid(),
    buyer: order.buyer,
    createdAt: new Date(),
    amount: order.total,
    currency: order.currency,
    status: PaymentTransactionStatus.PENDING,
    tags: [order.getTagName()],
  };
}

async function generateWireCardPaymentForOrder(order, wirecardProvider) {
  const transaction = {
    ...paymentTransactionFactory(order),
    merchant: wirecardProvider.getMerchantId(),
    type: "purchase",
  };

  const amountISO = CurrencyFactory.getAmountOfMoney({
    centsAmount: transaction.amount,
    currency: transaction.currency,
  });

  const transactionRequest = wirecardProvider.createTransactionRequest({
    date: transaction.createdAt,
    transactionId: transaction._id,
    transactionType: transaction.type,
    currencyAmount: amountISO.getCurrencyAmount(),
    currency: transaction.currency,
  });

  transaction.signature = transactionRequest.getSignature();

  // eslint-disable-next-line no-param-reassign
  order.payments.push(transaction._id);

  return Promise.all([
    repository.paymentTransaction.create(transaction),
    order.save(),
  ]).then(([trans]) => trans);
}

module.exports = ({ getProvider, availableProviders }) => async ({ order, provider, redirection, paymentMethodNonce }) => {
  let transaction;
  let method;

  // Create and Save Transaction for Purchase Order
  transaction = await repository.paymentTransaction.create({
    ...paymentTransactionFactory(order),
    paymentMethod: null,
  });

  // Add transaction to the order and save it
  order.payments.push(transaction.id);
  await order.save();

  // Pay the transaction here
  try {
    if (provider === PaymentMethodProviders.STRIPE || provider === PaymentMethodProviders.APPLEPAY || provider === PaymentMethodProviders.GOOGLEPAY) {
      return getProvider(stripeProvider)
        .createPaymentIntent(transaction.currency, transaction.amount, transaction.buyer)
        .then(async (paymentIntent) => {
          if (paymentIntent.error) {
              console.log({paymentIntent})
            return paymentIntent;
          } else {
            transaction.providerTransactionId = paymentIntent.id;
            await transaction.save();
            return {
              publishableKey: stripe.publishable,
              paymentClientSecret: paymentIntent.client_secret,
            };
          }
        });
    }
    else if (provider === PaymentMethodProviders.ALIPAY) {
      // console.log('Alipay getting.............', transaction);
      // console.log('redirection.............', redirection);
      // console.log('order.............', order);
      // console.log('provider.............', provider);
      // console.log('paymentMethodNonce.............', paymentMethodNonce);
      return getProvider(alipayProvider)
        .createOrder({
          transaction,
          order,
          redirection,
        })
        .then((paymentIntent) => {
          if (paymentIntent.error) {
            return paymentIntent;
          } else {
            return {
              paymentClientSecret: paymentIntent,
            };
          }
        });
    }
    else if (provider === PaymentMethodProviders.WECHATPAY) {
      return getProvider(stripeProvider)
        .createWeChatPaySource(transaction.currency, transaction.amount, transaction.buyer)
        .then((paymentIntent) => {
          if (paymentIntent.error) {
            return paymentIntent;
          } else {
            return {
              publishableKey: stripe.publishable,
              paymentClientSecret: paymentIntent.client_secret,
            };
          }
        });
    }
    else if (provider === PaymentMethodProviders.RAZORPAY) {
      return getProvider(razorpayProvider)
        .createOrder(transaction.currency, transaction.amount, transaction.buyer)
        .then((orderResponse) => {
          if (orderResponse.error) {
            return orderResponse;
          } else {
            return {
              publishableKey: "",
              paymentClientSecret: orderResponse.id,
            };
          }
        });
    }
    else if (provider === PaymentMethodProviders.PAYPAL) {
      return getProvider(paypalProvider)
        .createOrder(transaction.currency, transaction.amount, transaction.buyer, redirection)
        .then(async (orderResponse) => {
          if (orderResponse.error) return orderResponse;
          const [approveLink] = orderResponse.links.filter(
            (link) => link.rel === "approval_url"
          );
          transaction.providerTransactionId = orderResponse.id;
          transaction.responsePayload = { ...orderResponse, ...redirection}; //JSON.stringify(orderResponse);
          await transaction.save();
          return {
            publishableKey: "",
            paymentClientSecret: approveLink.href,
          };
        });
    } else if (provider === PaymentMethodProviders.UNIONPAY) {
      transaction.responsePayload = { ...redirection };
      await transaction.save();
      return {
        publishableKey: "",
        paymentClientSecret: getProvider(PaymentMethodProviders.UNIONPAY).generateLink(transaction),
      }
    }
    else if (provider === PaymentMethodProviders.LINEPAY) {
      return getProvider(linepayProvider)
        .createOrder(transaction)
        .then((orderResponse) => {
          if (orderResponse.error) {
            return orderResponse;
          } else {
            return {
              publishableKey: "",
              paymentClientSecret: JSON.stringify(orderResponse.paymentUrl),
            };
          }
        });
    }
    else if (provider === PaymentMethodProviders.BRAINTREE) {
      return getProvider(braintreeProvider)
        .createOrder(transaction.currency, transaction.amount, transaction.buyer, paymentMethodNonce)
        .then(async (response) => {
          if (response.error) return response;
          transaction.providerTransactionId = response.id;
          transaction.responsePayload = response;
          await transaction.save();
          return {
            publishableKey: "",
            paymentClientSecret: "",
          };
        })
    }
    return { error: provider };
  } catch (error) {
    await ordersBundle.executeOrderFailFlow(order);
    logger.error(`${error.name}: ${error.message}`);
  }
  return transaction;
};
