/* eslint-disable class-methods-use-this */
class AmountOfMoneyAbstract {
  constructor(cents) {
    if (typeof cents !== 'number') {
      throw new Error(`AmountOf${this.getCurrency()} can be created only with amount!`);
    }
    this.cents = cents;
  }

  getCentsAmount() {
    return this.cents;
  }

  getCurrencyAmount() {
    throw new Error('Not implemented');
  }

  getCurrency() {
    throw new Error('Not implemented');
  }

  getFormatted() {
    throw new Error('Not implemented');
  }

  getSymbol() {
    throw new Error('Not implemented');
  }
}

module.exports = AmountOfMoneyAbstract;
