const PaymentError = require('./PaymentException');

function TransactionNotFoundException(message) {
  this.name = 'TransactionNotFoundException';
  this.message = message;
  this.stack = (new Error()).stack;
}
TransactionNotFoundException.prototype = new PaymentError();

module.exports = TransactionNotFoundException;
