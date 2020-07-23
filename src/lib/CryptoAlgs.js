const Base64 = require('crypto-js/enc-base64');
const HMAC_SHA256 = require('crypto-js/hmac-sha256');


module.exports = {
  HmacSHA256(payload, secret) {
    return HMAC_SHA256(payload, secret).toString(Base64);
  },
};
