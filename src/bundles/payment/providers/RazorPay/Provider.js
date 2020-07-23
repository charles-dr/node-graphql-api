/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const path = require('path');
const Razorpay = require('razorpay');
const { UserInputError } = require('apollo-server');
const ProviderAbstract = require('../ProviderAbstract');
const { PaymentException } = require('../../Exceptions');
const { response } = require('../../../../viewers');

const { PaymentTransactionStatus } = require(path.resolve('src/lib/Enums'));

const logger = require(path.resolve('config/logger'));

class Provider extends ProviderAbstract {
  constructor({ keyID, keySecret }, repository) {
    super();
    this.client = new Razorpay({
      key_id: keyID,
      key_secret: keySecret,
    });
    this.repository = repository;
  }

  getName() {
    return 'RazorPay';
  }

  getGQLSchema() {
    const input = `
          input ${this.getGQLInputName()} {
              token: String!
          }
      `;

    return input;
  }

  async createOrder(currency, amount, buyer) {
    if(!this.client)
      console.log("RazorPay Connection Error !");
    
    const customer = await this.repository.paymentStripeCustomer.getByProvider(this.getName(), buyer);
    const orderDetails = {
      amount: amount,
      currency: currency,
      payment_capture: 1
    };
    
    if( !customer ) {
      const user = await this.repository.user.getById(buyer);
      if(!user.phone)
        throw new UserInputError("There is no phone number.");

      
      const newCustomer = await this.client.customers.create({
        name: user.name ? user.name : '',
        contact: user.phone.replace('+', ''),
        email: user.email
      }).then((response) => this.repository.paymentStripeCustomer.create({
        user: user.id,
        customerId: response.id,
        provider: this.getName(),
        paymentMethods: [],
      })).catch((error) => {
        console.log(error);
        return false;
      });
    
      if(!newCustomer)
        return {
          error: 'Creating new Razorpay customer failed!'
        };
    } 

    try {
      const response = await this.client.orders.create(orderDetails);
      return response

    } catch (error) {
      return {
        error: error.error.description,
      }
    }
  }
}
module.exports = Provider;
