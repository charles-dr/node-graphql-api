/* eslint-disable no-param-reassign */
const path = require('path');
const { Promise } = require('bluebird');

const ProductService = require(path.resolve('src/lib/ProductService'));
const axios = require('axios');
const jsonFile = 'http://www.floatrates.com/daily/usd.json';

// const currencyServiceUrl = 'https://api.exchangeratesapi.io/latest';
// const currencyServiceUrl = 'https://api.exchangerate.host/latest';
// const { Currency } = require('../../../../../lib/Enums');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

module.exports = async (_, {
  filter, page, sort,
}, { user, dataSources: { repository } }) => {
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };
    
  filter = await ProductService.composeProductFilter(filter, user);

  return Promise.all([
    repository.product.get({ filter, page, sort }),
    repository.product.getTotal(filter),
  ])
    .then(([collection, total]) => ({
      collection,
      pager: { ...pager, total },
    }))
    .catch((error) => {
      throw errorHandler.build([error]);
    });
};
