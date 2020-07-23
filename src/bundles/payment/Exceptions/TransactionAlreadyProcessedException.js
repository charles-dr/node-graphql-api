const PaymentError = require('./PaymentException');

function TransactionAlreadyProcessedException(message) {
  this.name = 'TransactionAlreadyProcessedException';
  this.message = message;
  this.stack = (new Error()).stack;
}
TransactionAlreadyProcessedException.prototype = new PaymentError();

module.exports = TransactionAlreadyProcessedException;
