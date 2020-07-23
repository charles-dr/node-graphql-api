/* eslint-disable class-methods-use-this */
const path = require('path');
const Provider = require('./Provider');

const repository = require(path.resolve('src/repository'));
const { payment: { providers: { stripe } } } = require(path.resolve('config'));

module.exports = new Provider(stripe, repository);
