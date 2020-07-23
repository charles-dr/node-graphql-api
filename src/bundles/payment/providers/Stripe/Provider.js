/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const path = require('path');
const stripe = require('stripe');
const { UserInputError } = require('apollo-server');
const { error } = require('console');
const ProviderAbstract = require('../ProviderAbstract');
const { PaymentException } = require('../../Exceptions');
const { response } = require('../../../../viewers');

const { PaymentTransactionStatus } = require(path.resolve('src/lib/Enums'));

const logger = require(path.resolve('config/logger'));

class Provider extends ProviderAbstract {
  constructor({ secret }, repository) {
    super();
    this.client = stripe(secret);
    this.repository = repository;
  }

  getName() {
    return 'Stripe';
  }

  getGQLSchema() {
    const input = `
          input ${this.getGQLInputName()} {
              token: String!
          }
      `;

    return input;
  }

  async addMethod({ token }, { dataSources: { repository }, user }) {
    if (!user.email) {
      throw new UserInputError('User does not have email address! Email is required', { invalidArgs: ['user'] });
    }

    let customer = await repository.paymentStripeCustomer.getByProvider(this.getName(), user.id);
    let paymentMethodResponse;
    if (customer && customer.customerId) {
      try {
        paymentMethodResponse = await this.client.customers.createSource(customer.customerId, { source: token });
      } catch (error) {
        logger.error(`[PAYMENT][STRIPE][ADD_CUSTOMER] failed "${error.message}"`);
        throw new UserInputError('Can\'t add card, try later', { invalidArgs: ['token'] });
      }
    } else {
      let customerResponse;
      try {
        customerResponse = await this.client.customers.create({
          source: token,
          email: user.email,
        });
      } catch (error) {
        logger.error(`[PAYMENT][STRIPE][ADD_CUSTOMER] failed "${error.message}"`);
        throw new UserInputError('Can\'t add card, try later', { invalidArgs: ['token'] });
      }

      if (!customerResponse || !customerResponse.id) {
        logger.error(`[PAYMENT][STRIPE][ADD_CUSTOMER] response is empty ${JSON.stringify(customer)}`);
        throw new UserInputError('Can\'t add card, try later', { invalidArgs: ['token'] });
      }

      // Create Stripe Customer in DB
      const stripeCustomerData = {
        user: user.id,
        customerId: customerResponse.id,
        provider: this.getName(),
        paymentMethods: [],
      };
      customer = await repository.paymentStripeCustomer.create(stripeCustomerData);

      if (customerResponse.sources
        && customerResponse.sources.object
        && customerResponse.sources.object === 'list'
        && customerResponse.sources.total_count > 0
      ) {
        [paymentMethodResponse] = customerResponse.sources.data;
      } else {
        logger.error(`[PAYMENT][STRIPE][ADD_CREDITCARD] customer without payment methods ${JSON.stringify(customerResponse)}`);
        throw new UserInputError('Can\'t add card, try later', { invalidArgs: ['token'] });
      }
    }

    // Create Payment Method in DB
    const expiredAt = new Date(`01.${paymentMethodResponse.exp_month}.20${paymentMethodResponse.exp_year}`);
    expiredAt.setMonth(1); // Usualy card works during expire month

    const paymentMethodData = {
      user: user.id,
      provider: this.getName(),
      providerIdentity: paymentMethodResponse.id,
      name: `${paymentMethodResponse.brand} ...${paymentMethodResponse.last4}`,
      expiredAt,
      data: paymentMethodResponse,
      usedAt: new Date(),
    };
    const paymentMethod = await repository.paymentMethod.create(paymentMethodData);

    // Update Customer and set the method
    customer.paymentMethods.push(paymentMethod.id);
    await customer.save();

    return paymentMethod;
  }

  async addNewCard(details, { dataSources: { repository }, user }) {
    if (!user.email) {
      throw new UserInputError('User does not have email address! Emal is required', { invalidArgs: ['user'] });
    }

    const customer = await repository.paymentStripeCustomer.getByProvider(this.getName(), user.id);
    const cardToken = await this.client.tokens.create({
      card: {
        number: details.number,
        exp_month: details.exp_month,
        exp_year: details.exp_year,
        cvc: details.cvc,
        name: details.name,
      },
    });
    const newCard = await this.client.customers.createSource(customer.customerId, { source: cardToken.id });
    const expiredAt = new Date(`01.${newCard.exp_month}.20${newCard.exp_year}`);
    expiredAt.setMonth(1); // Usualy card works during expire month
    return await repository.cardDetails.create({ ...details, providerID: newCard.id })
      .then((response) => repository.paymentMethod.create({
        user: user.id,
        provider: this.getName(),
        providerIdentity: newCard.id,
        name: `${newCard.brand} ...${newCard.last4}`,
        expiredAt,
        data: newCard,
        usedAt: new Date(),
        card: response.id,
      }))
      .then(async (newPaymentMethod) => {
        customer.paymentMethods.push(newPaymentMethod.id);
        await customer.save();
        return newPaymentMethod;
      })
      .catch((err) => {
        logger.error(`${error.message}`);
        throw new UserInputError('Can\'t add new Payment mothod, try later');
      });

    // console.log("********* New Card **********")
    // console.log(newCard)
    // let newPaymentMethodId;

    // const cardList = await this.client.customers.retrieve(customer.customerId)
    //     .then((response) => {
    //       if(response)
    //         return response.sources.data
    //       else {
    //         throw new UserInputError('Can\'t get Payments, try later');
    //       }
    //     });

    // await Promise.all(cardList.map( async (card) => {
    //   await repository.paymentMethod.getByCard({
    //     'data.id': card.id,
    //     'data.object': card.object,
    //     'data.brand': card.brand,
    //     'data.country': card.country,
    //     'data.customer': card.customer,
    //     'data.exp_month': card.exp_month,
    //     'data.exp_year': card.exp_year,
    //     'data.fingerprint': card.fingerprint,
    //     'data.funding': card.funding,
    //     'data.last4': card.last4,
    //   }).then(async (response) => {
    //     if (!response) {
    //       await repository.cardDetails.create({...details, providerID: card.id})
    //         .then((newCard) => {
    //           if(newCard) {
    //             const expiredAt = new Date(`01.${card.exp_month}.20${card.exp_year}`);
    //             expiredAt.setMonth(1); // Usualy card works during expire month
    //             const paymentMethodData = {
    //               user: user.id,
    //               provider: this.getName(),
    //               providerIdentity: card.id,
    //               name: `${card.brand} ...${card.last4}`,
    //               expiredAt,
    //               data: card,
    //               usedAt: new Date(),
    //               card: newCard.id
    //             };

    //             return paymentMethodData;
    //           } else

    //             return paymentMethodData;
    //           } else
    //             throw new UserInputError('Can\'t add new card, try later');
    //         }).then((newPaymentMethod) => repository.paymentMethod.create(newPaymentMethod))
    //         .then(async (response) => {
    //           newPaymentMethodId = response.id
    //           customer.paymentMethods.push(response.id);
    //           await customer.save();
    //         }).catch((error) => {
    //           logger.error(`${error.message}`);
    //           throw new UserInputError('Can\'t add new Payment mothod, try later');
    //         });
    //     }
    //   }).catch((error) => {
    //     logger.error(`${error.message}`);
    //     throw new UserInputError('Can\'t add new Payment mothod, try later');
    //   });
    // }));

    // if(newPaymentMethodId)
    //   return repository.paymentMethod.getById(newPaymentMethodId);
    // else
    //   throw new UserInputError("New Card is not added to this User");
  }

  async updateCard(details, { dataSources: { repository }, user }) {
    return repository.paymentStripeCustomer.getByProvider(this.getName(), user.id)
      .then(async (customer) => {
        const card = await this.repository.cardDetails.getById(details.id);
        if (!card) throw new UserInputError('Wrong Card ID.');

        const newCard = await this.client.customers.updateSource(
          customer.customerId,
          card.providerID,
          {
            name: details.name || null,
            exp_month: details.exp_month || null,
            exp_year: details.exp_year || null,
          },
        );

        if (!newCard) { throw new UserInputError('Update Card failed.'); }
        return newCard;
      }).then((newCard) => repository.cardDetails.update(details)
        .then((card) => repository.paymentMethod.updateCard(user.id, card.id, newCard)
          .catch((error) => {
            logger.error(`${error.message}`);
            throw new UserInputError('Upating Payment Method failed');
          })).catch((error) => {
          logger.error(`${error.message}`);
          throw new UserInputError('Updating Card Details failed.');
        })).catch((error) => {
        logger.error(`${error.message}`);
        throw new UserInputError('Updating Card Details failed.');
      });
  }

  async payTransaction(transaction) {
    // try get Stripe Customer by Buyer ID
    const stripeCustomer = await this.repository.paymentStripeCustomer
      .getByUserId(transaction.buyer);

    if (!stripeCustomer) {
      throw new PaymentException(`[STRIPE] The stripe customer is not find in DB by id ${transaction.buyer}`);
    }

    try {
      const paymentMethodId = transaction.paymentMethod.id || transaction.paymentMethod;
      const method = await this.repository.paymentMethod.getById(paymentMethodId);

      const response = await this.client.charges.create({
        amount: transaction.amount,
        currency: transaction.currency.toLowerCase(),
        customer: stripeCustomer.customerId,
        source: method.providerIdentity,
        metadata: {
          transaction_id: transaction.id,
          tags: transaction.tags.join(','),
        },
      });

      if (response && response.status && response.status === 'succeeded') {
        transaction.status = PaymentTransactionStatus.SUCCESS;
        transaction.providerTransactionId = response.id;
        transaction.responsePayload = JSON.stringify(response);
        transaction.processedAt = new Date(response.created);
        await transaction.save();
      } else {
        transaction.status = PaymentTransactionStatus.FAIL;
        transaction.providerTransactionId = response.id ? response.id : 'none';
        transaction.responsePayload = JSON.stringify(response);
        transaction.processedAt = response.created ? new Date(response.created) : new Date();
        await transaction.save();
      }
      logger.info(`[PAYMENT][STRIPE][PAY_TRANSACTION][${transaction.id}] ${transaction.status}`);
    } catch (error) {
      logger.error(`[PAYMENT][STRIPE][PAY_TRANSACTION] failed ${error.name}: ${error.message}`);
    }

    return transaction;
  }

  async createPaymentIntent(currency, amount, buyer) {
    if (!this.client) console.log('Stripe Connectin Error !');
    let newCustomer;

    const customer = await this.repository.paymentStripeCustomer.getByProvider(this.getName(), buyer);

    if (!customer) {
      const user = await this.repository.user.getById(buyer);
      newCustomer = await this.client.customers.create({
        email: user.email,
      }).then((response) => this.repository.paymentStripeCustomer.create({
        user: user.id,
        customerId: response.id,
        provider: this.getName(),
        paymentMethods: [],
      })).catch((error) => {
        console.log(error);
        return false;
      });

      if (!newCustomer) console.log('Creating new strhipe account failed');
      return {
        error: 'Creating new Stripe customer failed!',
      };
    }
    console.log('Created Strip Custommer', customer);
    newCustomer = customer;

    try {
      const response = await this.client.paymentIntents.create({
        amount,
        currency: currency.toLowerCase(),
        customer: newCustomer.customerId,
      });
      console.log('[Stripe response]', response.id);
      return response;
    } catch (error) {
      return {
        error: error.raw.message,
      };
    }
  }

  async createAlipayPaymentIntent(currency, amount, buyer) {
    /* if(!this.client)
      console.log("Stripe Connectin Error !");
    let newCustomer;

    const customer = await this.repository.paymentStripeCustomer.getByProvider(this.getName(), buyer);

    if(!customer) {
      const user = await this.repository.user.getById(buyer);
      newCustomer = await this.client.customers.create({
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

      if (!newCustomer) {
        return {
          error: 'Creating new Stripe customer failed!',
        };
      }
    } else {
      newCustomer = customer;
    } */

    /* return this.client.paymentIntents.create({
      payment_method_types: ['alipay'],
      amount,
      currency: currency.toLowerCase(),
      customer: newCustomer.customerId,
    }).catch((error) => ({
      error: error.raw.message,
    })); */
  }

  async deletePaymentMethod(id, { dataSources: { repository }, user }) {
    return repository.paymentMethod.getById(id)
      .then((paymentMethod) => repository.cardDetails.delete(paymentMethod.card)
        .then(() => repository.paymentMethod.delete(paymentMethod.id))
        .then(() => repository.paymentStripeCustomer.deletePaymentMethod(user.id, paymentMethod.id))
        .then((response) => {
          if (response) return { success: true };
        })
        .catch((error) => {
          logger.error(`${error.message}`);
        })).catch((error) => {
        logger.error(`${error.message}`);
        throw new UserInputError(`Delete Payment Method Failed. (${error.message})`);
      });
  }

  async createWeChatPaySource(currency, amount, buyer) {
    if (!this.client) { console.log('Stripe Connectin Error !'); }
    let newCustomer;

    const customer = await this.repository.paymentStripeCustomer.getByProvider(this.getName(), buyer);

    if (!customer) {
      const user = await this.repository.user.getById(buyer);
      newCustomer = await this.client.customers.create({
        email: user.email,
      }).then((response) => this.repository.paymentStripeCustomer.create({
        user: user.id,
        customerId: response.id,
        provider: this.getName(),
        paymentMethods: [],
      })).catch((error) => {
        console.log(error);
        return false;
      });

      if (!newCustomer) {
        return {
          error: 'Creating new Stripe customer failed!',
        };
      }
    } else {
      newCustomer = customer;
    }

    return await this.client.sources.create({
      type: 'wechat',
      amount,
      currency: currency.toLowerCase(),
    }).catch((error) => ({
      error: error.raw.message,
    }));
  }
}
module.exports = Provider;
