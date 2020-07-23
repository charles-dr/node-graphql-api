/* eslint-disable global-require */
const path = require('path');

const { payment } = require(path.resolve('config'));

const payPurchaseOrderAction = require('./actions/payPurchaseOrder');

const providers = {
  WIRECARD: require('./providers/WireCard'),
  Stripe: require('./providers/Stripe'),
  RazorPay: require('./providers/RazorPay'),
  PayPal: require('./providers/PayPal'),
  AliPay: require('./providers/Alipay'),
  LinePay: require('./providers/LinePay'),
  UnionPay: require('./providers/UnionPay'),
  Braintree: require('./providers/Braintree'),
};

if (payment.testMode) {
  providers.FAKE = require('./providers/Fake');
}

const bundle = {
  providers,
  availableProviders() {
    return Object.values(providers).map((provider) => provider.getName());
  },
  getProvider(name) {
    const [provider] = Object.values(providers).filter((item) => item.getName() === name);
    return provider;
  },
};
bundle.payPurchaseOrder = payPurchaseOrderAction(bundle);

module.exports = bundle;
