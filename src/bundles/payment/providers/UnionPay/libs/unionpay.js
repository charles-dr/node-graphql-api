'use strict'

const utils = require('./utils');
const gateway = require('./gateway');
const fs = require('fs');
const qs = require('query-string');

class Unionpay {
    /**
    * 初始化
    * @param {Object} opts 配置信息
    * - merid 商户ID
    * - frontUrl 通知地址
    * - cer 证书文件
    * - pfxPath 证书文件路径
    * - pfxPassword 证书文件密码
    */
    constructor(opts) {
        this.merId = opts.merId;
        this.frontUrl = opts.frontUrl;
        this.backUrl = opts.backUrl;
        this.pfxPath = opts.pfxPath;
        this.pfxPassword = opts.pfxPassword;
        this.cer = opts.cer;
        this.sandbox = opts.sandbox || false;
        this.certId = '';
        this.publicKey = '';
        this.privateKey = '';
    }

    /**
     * 初始化key
     */
    async initKey() {
      console.log('[Init Key]')
        if (this.certId && this.publicKey && this.privateKey) 
            return;
        const pem = await utils.pfx2pem(this.pfxPath, this.pfxPassword);
        this.privateKey = pem.key;
        this.certId = utils.h2d(pem.attributes.serial);
        this.publicKey = fs.readFileSync(this.cer).toString();
    }

    async queryTrans({ orderId, txnTime }) {
      const commonParams = utils.commonParams(this);
      const exParams = {
        txnType: '00',
        txnSubType: '00',
        bizType: '000000',
        accessType: '0',
        channelType: '07',
        orderId,
        txnTime,
      };
      const params = utils.signObject({ ...commonParams, ...exParams }, this);
      return utils.request(this.sandbox ? gateway.queryTrans.test : gateway.queryTrans.product, params)
        .then(resl => qs.parse(resl));

    }

    /**
     * 银联支付-app控件支付-消费类交易，获取参数
     * @param {Object} obj
     * - orderId 订单id
     * - txnAmt 金额(分)
     * - orderDesc 商品描述
     * @return tn 交易流水号 出错为null
     */
    async getAppTn(obj) {
        // App支付特定类型设置
        obj.bizType = "000201";
        obj.txnType = "01";           // 交易类型
        obj.txnSubType = "01";        // 交易子类
        
        return new Promise(async (resolve, reject) => {
            let formData = await utils.buildParams(obj, this);
            const body = await utils.request(this.sandbox ? gateway.appTransReq.test : gateway.appTransReq.product, formData);
            // const body = await utils.request(this.sandbox ? gateway.backTransReq.test : gateway.appTransReq.product, formData);
            const bodyObj = qs.parse(body);
            var tn = body['tn'];
            var s = body.split('&');
            if(tn){
                resolve(bodyObj);
            }else{
                reject(bodyObj);
            }
        })
    };

    getParams(obj) {
        // App支付特定类型设置
        obj.bizType = "000201";
        obj.txnType = "01";           // 交易类型
        obj.txnSubType = "01";        // 交易子类
        let formData = utils.buildParams(obj, this);
        return formData;
    }

    /**
     * 交易查询
     * @param {Object} obj
     * - orderId 订单id
     * @return {Object}
     */
    async queryTrade(obj) {
        // 支付查询特定类型设置
        obj.bizType = "000802";       // 产品类型
        obj.txnType = "00";           // 交易类型
        obj.txnSubType = "00";        // 交易子类
        return new Promise(async (resolve, reject) => {
            let formData = await utils.buildParams(obj, this);
            const body = await utils.request(this.sandbox ? gateway.queryTrans.test : gateway.queryTrans.product, formData);
            const bodyObj = qs.parse(body);
            if (body) {
                resolve(bodyObj);
            } else {
                reject(bodyObj);
            }
        })
    };

    /**
     * 银联验签
     * @param {Object} obj 银联的回调参数
     * @return {Bool} true则签名成功
     */
    async verify(obj) {
        return new Promise(async (resolve, reject) => {
            let result = await utils.verify(obj, this.publicKey);
            if (!result) {
                reject('签名失败')
            }
            let transStatus = obj.respCode;
            if ("" != transStatus && "00" == transStatus) {
                resolve(true)
            } else {
                reject('返回数据出错')
            }
        })
    }

}

module.exports = Unionpay;
