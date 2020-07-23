const NodeCache = require('node-cache');
const axios = require('axios');
const path = require('path');
const { Currency } = require('./Enums');
const { CurrencyFactory } = require('./CurrencyFactory');

const logger = require(path.resolve('config/logger'));
const { exchangeCurrencyRates } = require(path.resolve('config'));
const cache = new NodeCache();
// const currencyServiceUrl = 'https://api.exchangeratesapi.io/latest';
// const currencyServiceUrl = 'https://api.exchangerate.host/latest';
const currencyServiceUrl = 'https://api.exchangerate.host/convert';
const jsonFile = 'http://www.floatrates.com/daily/usd.json'

function UpdateRate() {
  const rates = {}

  axios.get(jsonFile)
    .then(({ data }) => {
      Object.keys(data).some((key) => {
        rates[key.toUpperCase()] = data[key].rate
      })
      rates['USD'] = 1
      const oldRates = cache.get('CURRENCY_RATES');
      if (oldRates && Object.keys(rates).some((key) => Math.abs(rates[key] - oldRates[key]) / rates[key] > 0.1)) {
        // Rates are too different
        logger.error('New Rates rates are too different:');
        logger.error(`Old Rates: ${JSON.stringify(oldRates)}`);
        logger.error(`New Rates: ${JSON.stringify(rates)}`);
        return 0;
      }

      if (oldRates && !Object.keys(rates).some((key) => rates[key] !== oldRates[key])) {
        // Rates are the same
        return 0;
      }

      logger.info(`New Rates added to cache:`); // ${JSON.stringify(rates)}`);
      return cache.set('CURRENCY_RATES', rates);
    })
    .catch((error) => {
      logger.error(`Error happend while updating Currency Cache. Original error: ${error.message}`);
    });
}

UpdateRate();
setInterval(UpdateRate, exchangeCurrencyRates.TTL);

module.exports.CurrencyService = {
  exchange(amount, to) {
    if (typeof amount === 'undefined') {
      throw new Error('CurrencyService.exchange expected "amount" parameter');
    }
    if (typeof Currency[to] === 'undefined') {
      throw new Error('CurrencyService.exchange expected "to" parameter');
    }

    const cached = cache.get('CURRENCY_RATES');
    if (cached && cached[amount.getCurrency()] && cached[to]) {
      return Promise.resolve(CurrencyFactory.getAmountOfMoney({
        currencyAmount: amount.getCurrencyAmount() / cached[amount.getCurrency()] * cached[to],
        currency: to,
      }));
    } 

    const rates = {}
    const params = {
      from: amount.getCurrency(),
      to: to
    }
    return axios({
      url: currencyServiceUrl,
      params: params
    })
      .then(({ data }) => {
        if(data.success) {
          return CurrencyFactory.getAmountOfMoney({
            currencyAmount: amount.getCurrencyAmount() * data.result,
            currency: to,
          });
        }
        // Object.keys(data).some((key) => {
        //   rates[key.toUpperCase()] = data[key].rate
        // })
        // rates['USD'] = 1
        // logger.warn(`Got currency from API - ${JSON.stringify(rates)}`);
        // return CurrencyFactory.getAmountOfMoney({
        //   currencyAmount: amount.getCurrencyAmount() / rates[amount.getCurrency()] * rates[to],
        //   currency: to,
        // });
      })
      .catch((error) => {
        throw new Error(error);
      });
  },
};
