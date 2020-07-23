const PaymentError = require('./PaymentException');

function PaymentMethodUsesWrongProviderException(message) {
  this.name = 'PaymentMethodUsesWrongProviderException';
  this.message = message;
  this.stack = (new Error()).stack;
}
PaymentMethodUsesWrongProviderException.prototype = new PaymentError();

module.exports = PaymentMethodUsesWrongProviderException;
