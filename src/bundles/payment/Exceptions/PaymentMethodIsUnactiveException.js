const PaymentError = require('./PaymentException');

function PaymentMethodIsUnactiveException(message) {
  this.name = 'PaymentMethodIsUnactiveException';
  this.message = message;
  this.stack = (new Error()).stack;
}
PaymentMethodIsUnactiveException.prototype = new PaymentError();

module.exports = PaymentMethodIsUnactiveException;
