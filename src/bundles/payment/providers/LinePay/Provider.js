/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const path = require('path');
const ProviderAbstract = require('../ProviderAbstract');
const linePay = require("line-pay");
// const { UserInputError } = require('apollo-server');
// const { PaymentException } = require('../../Exceptions');
// const { PaymentTransactionStatus } = require(path.resolve('src/lib/Enums'));
// const logger = require(path.resolve('config/logger'));


class Provider extends ProviderAbstract {
  constructor({ pay_channel_ID, pay_channel_secret, confirmURL, cancelUrl }, repository) {
    super();
    this.client = new linePay({
        channelId: pay_channel_ID,
        channelSecret: pay_channel_secret,
        isSandbox: true
    });
    this.repository = repository;
    this.confirmURL = confirmURL;
    this.cancelUrl = cancelUrl;
  }

  getName() {
    return 'LinePay';
  }

  getGQLSchema() {
    const input = `
          input ${this.getGQLInputName()} {
              token: String!
          }
      `;

    return input;
  }

    async createOrder(transaction) {
        if(!this.client)
            console.log("LinePay Connection Failed !")

        const currency = transaction.currency 
        const amount = transaction.amount
        const buyer = transaction.buyer
        const customer = await this.repository.paymentStripeCustomer.getByProvider(this.getName(), buyer);
        let reservation = {
            productName: buyer,
            amount: amount,
            currency: currency,
            orderId: transaction.id,
            confirmUrl: this.confirmURL,
            confirmUrlType: "SERVER",
            cancelUrl: this.cancelUrl
        };

        
        return this.client.reserve(reservation).then((response) => {
          if(response.returnCode === '0000')
            return response.info
          else 
            return {
              error: response.returnMessage
            }
        })
    }
}
module.exports = Provider;
