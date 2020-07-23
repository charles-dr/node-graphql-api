/* eslint-disable class-methods-use-this */

const ProviderAbstract = require('../ProviderAbstract');

class Provider extends ProviderAbstract {
  getName() {
    return 'Fake';
  }

  getGQLSchema() {
    const input = `
        input ${this.getGQLInputName()} {
            name: String!
            expires: PaymentMethodExpiresInput!
        }
    `;

    return input;
  }

  async addMethod({ name, expires }, { dataSources: { repository }, user }) {
    const expiredAt = new Date(`01.${expires.month}.20${expires.year}`);
    expiredAt.setMonth(1); // Usualy card works during expire month

    const paymentMethod = {
      user,
      name,
      expiredAt,
      provider: this.getName(),
    };
    return repository.paymentMethod.create(paymentMethod);
  }
}

module.exports = new Provider();
