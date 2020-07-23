/* eslint-disable no-param-reassign */
const path = require('path');
const { Promise } = require('bluebird');

const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const axios = require('axios');
const jsonFile = 'http://www.floatrates.com/daily/usd.json';

async function exchangeOnSupportedCurrencies(price) {
  const currencies = CurrencyFactory.getCurrencies();

  const exchangePromises = currencies.map(async (currency) => {
    const amountOfMoney = CurrencyFactory.getAmountOfMoney({
      currencyAmount: price.amount, currency: price.currency,
    });

    if (price.currency === currency) {
      return { amount: amountOfMoney.getCentsAmount(), currency };
    }

    return CurrencyService.exchange(amountOfMoney, currency)
      .then((money) => ({ amount: money.getCentsAmount(), currency }));
  });

  return Promise.all(exchangePromises);
}

module.exports = async (_, {
  category, page, sort,
}, { user, dataSources: { repository } }) => {
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };

  if (user) {
    filter.blackList = user.blackList;
  }

  if (filter.categories) {
    const categories = [...filter.categories];
    await Promise.all(categories.map(async (category) => {
      await repository.productCategory.getByParent(category)
        .then((subcategories) => {
          if (subcategories.length > 0) {
            subcategories.map((item) => {
              filter.categories.push(item.id);
            });
          }
        });
    }));
  }

  if (sort.feature == 'PRICE') {
    const temppage = {
      limit: 0,
      skip: 0,
    };

    return Promise.all([
      repository.product.get({ filter, page: temppage, sort }),
      repository.product.getTotal(filter),
    ]).then(([allProducts, total]) => axios.get(jsonFile)
      .then(({ data }) => {
        const rates = {};
        Object.keys(data).some((key) => {
          rates[key.toUpperCase()] = data[key].rate;
        });
        rates.USD = 1;
        if (sort.type == 'ASC') { allProducts.sort((a, b) => a.price / rates[a.currency] - b.price / rates[b.currency]); } else { allProducts.sort((a, b) => b.price / rates[b.currency] - a.price / rates[a.currency]); }
        let collection;
        if (page.limit > 0) { collection = allProducts.slice(page.skip, page.skip + page.limit); } else { collection = allProducts.slice(page.skip); }
        return { collection, pager: { ...pager, total } };
      }));
  }

  return Promise.all([
    repository.product.get({ filter, page, sort }),
    repository.product.getTotal(filter),
  ])
    .then(([collection, total]) => ({
      collection,
      pager: { ...pager, total },
    }));
};
