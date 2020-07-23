function PaymentException(message) {
  this.name = 'PaymentException';
  this.message = message;
  this.stack = (new Error()).stack;
}
PaymentException.prototype = new Error();

module.exports = PaymentException;
