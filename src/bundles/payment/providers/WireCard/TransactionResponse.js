/* eslint-disable camelcase */
const path = require('path');
const Base64 = require('crypto-js/enc-base64');
const Utf8 = require('crypto-js/enc-utf8');

const { PaymentTransactionStatus } = require(path.resolve('src/lib/Enums'));

const CryptoAlgs = require(path.resolve('src/lib/CryptoAlgs'));

const stateStatusMapping = {
  success: PaymentTransactionStatus.SUCCESS,
  failure: PaymentTransactionStatus.FAIL,
};

class TransactionResponse {
  constructor({
    merchantId, secret, ...data
  }) {
    this.algorithm = 'HmacSHA256';
    this.merchantId = merchantId;
    this.secret = secret;
    this.data = data;

    [this.payloadBase64, this.digest] = this.data.response_signature_v2.split('.');
  }

  get payload() {
    return Base64.parse(this.payloadBase64).toString(Utf8);
  }

  isValid() {
    if (!CryptoAlgs[this.algorithm]) {
      return false;
    }
    const algorithm = CryptoAlgs[this.algorithm];

    if (algorithm(this.payload, this.secret) !== this.digest) {
      return false;
    }

    return true;
  }

  getTransactionId() {
    return this.data.request_id;
  }

  getProviderTransactionId() {
    return this.data.transaction_id;
  }

  getState() {
    return this.data.transaction_state;
  }

  getStatus() {
    return stateStatusMapping[this.getState()] || PaymentTransactionStatus.FAIL;
  }

  getAmountOfMoney() {
    return {
      amount: this.data.requested_amount,
      currency: this.data.requested_amount_currency,
    };
  }

  getDate() {
    const parts = this.data.completion_time_stamp.match(/.{2}/g);
    return new Date(parts[0] + parts[1], parts[2], parts[3], parts[4], parts[5], parts[6]);
  }
}

module.exports = TransactionResponse;
