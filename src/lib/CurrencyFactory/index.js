const requireDir = require('require-dir');

const currencies = requireDir('./currencies');

module.exports.CurrencyFactory = {
  getAmountOfMoney({ currencyAmount, centsAmount, currency }) {
    const CurrencyStrategy = currencies[currency];
    if (!CurrencyStrategy) {
      throw new Error(`We does not support "${currency}" currency.`);
    }
    const amountOfMoney = new CurrencyStrategy({ centsAmount, currencyAmount });

    return amountOfMoney;
  },
  getCurrencies() {
    return Object.keys(currencies);
  },
};
