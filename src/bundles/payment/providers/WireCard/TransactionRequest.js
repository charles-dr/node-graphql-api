const path = require('path');
const Utf8 = require('crypto-js/enc-utf8');
const Base64 = require('crypto-js/enc-base64');

const CryptoAlgs = require(path.resolve('src/lib/CryptoAlgs'));

class TransactionRequest {
  constructor({
    date, transactionId, transactionType, currencyAmount, currency, merchantId, secret,
  }) {
    this.date = date;
    this.transactionId = transactionId;
    this.transactionType = transactionType;
    this.currencyAmount = currencyAmount;
    this.currency = currency;
    this.algorithm = 'HmacSHA256';
    this.merchantId = merchantId;
    this.secret = secret;
  }

  getPayload() {
    const amountDecimal = this.currencyAmount % 10 === 0 ? `${this.currencyAmount}.0` : this.currencyAmount;
    const dateISO = this.date.toISOString();
    return [
      'HS256',
      `request_time_stamp=${dateISO.substr(0, dateISO.length - 5)}Z}`,
      `merchant_account_id=${this.merchantId}`,
      `request_id=${this.transactionId}`,
      `transaction_type=${this.transactionType}`,
      `requested_amount=${amountDecimal}`,
      `requested_amount_currency=${this.currency}`,
    ]
      .join('\n');
  }

  getDigest() {
    if (!CryptoAlgs[this.algorithm]) {
      return false;
    }
    const algorithm = CryptoAlgs[this.algorithm];

    return algorithm(this.getPayload(), this.secret);
  }

  getSignature() {
    const payloadBase64 = Base64.stringify(Utf8.parse(this.getPayload()));
    const digist = this.getDigest();
    return `${payloadBase64}.${digist}`;
  }
}

module.exports = TransactionRequest;
