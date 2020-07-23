const PaymentError = require('./PaymentException');

function TransactionSignatureFailedException(message) {
  this.name = 'TransactionSignatureFailedException';
  this.message = message;
  this.stack = (new Error()).stack;
}
TransactionSignatureFailedException.prototype = new PaymentError();

module.exports = TransactionSignatureFailedException;
