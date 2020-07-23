const uuid = require('uuid/v4');

class PaymentStripeCustomerRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getByUserId(id) {
    return this.model.findOne({ user: id });
  }

  async getByCustomerID(id) {
    return this.model.findOne({ customerId: id });
  }

  async getByProvider(provider, userID) {
    return this.model.findOne({
      provider: provider,
      user: userID
    })
  }

  async create(data) {
    const customer = new this.model({
      _id: uuid(),
      ...data,
    });
    return customer.save();
  }

  async deletePaymentMethod(userID, paymentMethodID) {
    const PaymentStripeCustomer = await this.getByUserId(userID);
    const newPayments = [];
    PaymentStripeCustomer.paymentMethods.map((item) => {
      if(item !== paymentMethodID)
        newPayments.push(item);
    });

    PaymentStripeCustomer.paymentMethods = newPayments;

    return PaymentStripeCustomer.save();
  }
}

module.exports = PaymentStripeCustomerRepository;
