/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const path = require('path');
const { UserInputError } = require('apollo-server');
// const Alipay = require('alipay-nodejs');

const AlipaySdk = require('alipay-sdk').default;
const AlipayFormData = require('alipay-sdk/lib/form').default;

const fs = require('fs');
const { error } = require('console');
const ProviderAbstract = require('../ProviderAbstract');
const { PaymentException } = require('../../Exceptions');
const { response } = require('../../../../viewers');

const { domain, protocol } = require(path.resolve('config'));

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { PaymentTransactionStatus } = require(path.resolve('src/lib/Enums'));
const logger = require(path.resolve('config/logger'));

const activity = {
  generateErrorString: (error) => {
    if (error.response.details) {
      return error.response.details.map((detail) => detail.issue).join('; ');
    }
    return error.response.message;
  },
};

class Provider extends ProviderAbstract {
  constructor(repository) {
    super();
    // let private_key=fs.readFileSync(path.join(__dirname,'private.txt'))
    const privateKey = fs.readFileSync(path.join(__dirname, 'private.txt')).toString();
    const publicKey = fs.readFileSync(path.join(__dirname, 'public.txt')).toString();
    // console.log('privateKey', privateKey);
    // const publicKey = fs.readFileSync(path.join(__dirname, 'sandboxPublic.txt'));
    /* this.client = new Alipay({
      app_id: '2021002131638022',
      // app_id: '2021000117621395', // sandbox
      notify_url: 'https://xiufu88.com/csallback/alipay',
      app_private_key: privateKey,
      alipay_public_key: publicKey,
    }); */
    this.client = new AlipaySdk({
      /** 支付宝网关 * */
      gateway: 'https://openapi.alipay.com/gateway.do',
      /** 应用id，如何获取请参考：https://opensupport.alipay.com/support/helpcenter/190/201602493024 * */
      appId: '2021002131638022',
      /** 应用私钥，密钥格式为pkcs1，如何获取私钥请参考：https://opensupport.alipay.com/support/helpcenter/207/201602469554  * */
      privateKey,
      /** 支付宝公钥，如何获取请参考：https://opensupport.alipay.com/support/helpcenter/207/201602487431 * */
      alipayPublicKey: publicKey,

      /** 签名算法类型 * */
      signType: 'RSA2',
      keyType: 'PKCS8',
    });
    // console.log('alipay sdk======>', this.client);
    this.repository = repository;
  }

  getName() {
    return 'Alipay';
  }

  getGQLSchema() {
    const input = `
          input ${this.getGQLInputName()} {
              token: String!
          }
      `;
    return input;
  }

  async createOrder({
    transaction,
    order,
    redirection,
  }) {
    // amount is in cents
    // console.log('buildSignOrderParam===>', this.client);
    const amountOfMoney = CurrencyFactory.getAmountOfMoney({
      centsAmount: transaction.amount,
      currency: transaction.currency,
    });
    console.log('amountOfMoney', transaction, order, amountOfMoney);
    if (!this.client) console.log('Alipay Connection Error !');
    /* const paymentReqJson = {
      body: '对一笔交易的具体描述信息。如果是多种商品，请将商品描述字符串累加传给body',
      subject: '大乐透',
      out_trade_no: `xifu88${Math.random().toString().substr(2, 10)}`,
      total_amount: amountOfMoney.getCurrencyAmount(),
      timeout_express: '90m',
      product_code: 'Test Product',
    };
    const result = this.client.buildSignOrderParam(paymentReqJson);
    console.log('alipay result', result);
    const baseUrl = 'https://openapi.alipay.com/gateway.do?';
    // const baseUrl = 'https://openapi.alipaydev.com/gateway.do/?';
    return baseUrl + result; */
    const formData = new AlipayFormData();
    formData.setMethod('get');
    const bizContent = {
      /** 商户订单号,商户自定义，需保证在商户端不重复，如：20200612000001 * */
      OutTradeNo: `${transaction.id}`,
      /** 销售产品码，固定值 FAST_INSTANT_TRADE_PAY * */
      ProductCode: 'FAST_INSTANT_TRADE_PAY',
      /** 订单标题 * */
      Subject: `订单编号:${transaction.id}`,
      /** 订单金额，精确到小数点后两位 * */
      TotalAmount: `${amountOfMoney.getCurrencyAmount()}`,
      /** 订单描述 * */
      Body: `该订单交易受吉腾的保护${new Date().toLocaleTimeString()}`,
      // extendParams:{
      /** 系统商编号，填写服务商的PID用于获取返佣，返佣参数传值前提：传值账号需要签约返佣协议，用于isv商户。 * */
      // SysServiceProviderId: '2088****000',
      /** 花呗参数传值前提：必须有该接口花呗收款准入条件，且需签约花呗分期 * */
      /** 指定可选期数，只支持3/6/12期，还款期数越长手续费越高 * */
      // HbFqNum: '3',
      /** 指定手续费承担方式，手续费可以由用户全承担（该值为0），也可以商户全承担（该值为100），但不可以共同承担，即不可取0和100外的其他值。 * */
      // HbFqSellerPercent: '0',
      // },
    };
    formData.addField('bizContent', bizContent);
    /** 注：支付结果以异步通知为准，不能以同步返回为准，因为如果实际支付成功，但因为外力因素，如断网、断电等导致页面没有跳转，则无法接收到同步通知；* */
    /** 支付完成的跳转地址,用于用户视觉感知支付已成功，传值外网可以访问的地址，如果同步未跳转可参考该文档进行确认：https://opensupport.alipay.com/support/helpcenter/193/201602474937 * */
    formData.addField('returnUrl', redirection.success);
    /** 异步通知地址，以http或者https开头的，商户外网可以post访问的异步地址，用于接收支付宝返回的支付结果，如果未收到该通知可参考该文档进行确认：https://opensupport.alipay.com/support/helpcenter/193/201602475759 * */
    formData.addField('notifyUrl', 'https://api.xiufu88.com/webhooks/payment/alipay');
    /** 第三方调用（服务商模式），传值app_auth_token后，会收款至授权token对应商家账号，如何获传值app_auth_token请参考文档：https://opensupport.alipay.com/support/helpcenter/79/201602494631 * */
    // formData.addField('appAuthToken', '服务商模式，传入app_auth_token，如何获取请参考文档：https://opensupport.alipay.com/support/helpcenter/79/201602494631');
    /** 获取接口调用结果，如果调用失败，可根据返回错误信息到该文档寻找排查方案：https://opensupport.alipay.com/support/helpcenter/97 * */
    return new Promise((resolve) => {
      this.client.exec(
        'alipay.trade.page.pay',
        {},
        { formData },
      ).then((result) => {
        /** 获取接口调用结果，如果调用失败，可根据返回错误信息到该文档寻找排查方案：https://opensupport.alipay.com/support/helpcenter/84 * */
        console.log('alipay adk result', result);
        resolve(result);
      }).catch((e) => {
        resolve(e);
      });
      /* this.client.payment.create(create_payment_json, (error, payment) => {
        if (error) {
          resolve({ error: activity.generateErrorString(error) });
        } else {
          resolve(payment);
        }
      }); */
    });
  }
}
module.exports = Provider;
