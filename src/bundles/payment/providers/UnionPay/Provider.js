/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const path = require('path');
const paypal = require('paypal-rest-sdk');
const { UserInputError } = require('apollo-server');


const ProviderAbstract = require('../ProviderAbstract');
const { PaymentException } = require('../../Exceptions');
const { response } = require('../../../../viewers');
const { domain, protocol } = require(path.resolve('config'));
const { error } = require('console');
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));

const { PaymentTransactionStatus } = require(path.resolve('src/lib/Enums'));
const logger = require(path.resolve('config/logger'));


const UnionPay = require('./libs/unionpay');
const { frontForm } = require('./libs/form.templ');


const activity = {
  generateErrorString: (error) => {
    if (error.response.details) {
      return error.response.details.map(detail => detail.issue).join('; ');
    } else {
      return error.response.message;
    }
  },
}

class Provider extends ProviderAbstract {
  constructor(config, repository) {
    super();
    this.config = config;
    this.repository = repository;
  }

  getName() {
    return 'UnionPay';
  }

  getGQLSchema() {
    const input = `
          input ${this.getGQLInputName()} {
              token: String!
          }
      `;
    return input;
  }

  generateLink({ id: transactionId }) {
    return `${protocol}://${domain}/pages/union-pay/txn/${transactionId}`;
  }

  async composeFormHTML({ redirectTo, amount, description }) {
    const unionPay = new UnionPay({
      merId: this.config.merchantId,
      pfxPassword: this.config.password,
      pfxPath: path.resolve(this.config.privateKeyPath),
      cer: path.resolve(this.config.publicKeyPath),
      sandbox: this.config.mode === 'sandbox',
      frontUrl: `${protocol}://${domain}/webhooks/payment/unionpay/front-url`,
      backUrl: `${protocol}://${domain}/webhooks/payment/unionpayj/back-url`,
    });
    await unionPay.initKey();
    const formData = unionPay.getParams({
        orderId: Date.now(),
        txnAmt: amount,
        orderDesc: description || "支付测试",
    });
  
    let inputs = ``;
    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        inputs += `<input type="hidden" name="${key}" value="${formData[key]}" />\n`;
      }
    })
  
    const html = frontForm.replace('{{url}}', 'https://gateway.test.95516.com/gateway/api/frontTransReq.do').replace('{{inputs}}', inputs).replace('{{type}}', 'FRONT PAY');
    return { html, data: formData };
  }

  async queryOrder() {
    const unionPay = new UnionPay({
      merId: this.config.merchantId,
      pfxPassword: this.config.password,
      pfxPath: path.resolve(this.config.privateKeyPath),
      cer: path.resolve(this.config.publicKeyPath),
      sandbox: this.config.mode === 'sandbox',
      // frontUrl : "http://127.0.0.1/unionpay/notify",
      frontUrl: redirectTo || `${protocol}://${domain}/webhooks/payment/unionpay`,
      backUrl: `${protocol}://${domain}/webhooks/payment/unionpay-back`,
    });
    await unionPay.initKey();
    const formData = unionPay.getParams({
        orderId: Date.now(),
        txnAmt: amount,
        orderDesc: description || "支付测试",
        // testParam: "testParam",
    });

    let inputs = ``;
    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        inputs += `<input type="hidden" name="${key}" value="${formData[key]}" />\n`;
      }
    })
  
    const html = frontForm.replace('{{url}}', 'https://gateway.test.95516.com/gateway/api/frontTransReq.do').replace('{{inputs}}', inputs).replace('{{type}}', 'FRONT PAY');
  
    // res.send(html); //tn;
    return html;
  }
}

module.exports = Provider;
