const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError, ForbiddenError } = require('apollo-server');
const { product } = require('puppeteer');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { providers: { ShipEngineService } } = require(path.resolve('src/bundles/delivery'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { shoclefCompany } = require(path.resolve('config'));

const errorHandler = new ErrorHandler();

module.exports = async (_, args, { dataSources: { repository } }) => {
  const { option } = args;
  const validator = new Validator(option, {
    buyer: 'required|object',
    'buyer.name': 'required',
    'buyer.phone': 'required|phoneNumber',
    shipTo: 'required|object',
    'shipTo.street': 'required',
    'shipTo.city': 'required',
    'shipTo.zipCode': 'required',
    'shipTo.description': 'required',
    'shipTo.country': 'required',
    'shipTo.region': 'required',
    product: 'required|object',
    'product.price': 'required|decimal',
    'product.currency': 'required',
    'product.quantity': 'required|integer',
    'product.description': 'required',
    package: 'required|object',
    'package.weight': 'required|object',
    'package.weight.unit': 'required',
    'package.weight.value': 'required|decimal',
    'package.dimensions': 'required|object',
    'package.dimensions.unit': 'required',
    'package.dimensions.width': 'required|decimal',
    'package.dimensions.height': 'required|decimal',
    'package.dimensions.length': 'required|decimal',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
      if (args.option.seller) {
        if (!args.option.seller.name) { throw new UserInputError('Seller name required!'); }
        if (!args.option.seller.phone) { throw new UserInputError('Seller phone number required!'); }
      }

      if (args.option.shipFrom) {
        if (!args.option.shipFrom.street) { throw new UserInputError('ShipFrom stree required!'); }
        if (!args.option.shipFrom.city) { throw new UserInputError('ShipFrom city required!'); }
        if (!args.option.shipFrom.zipCode) { throw new UserInputError('ShipFrom zipCode required!'); }
        if (!args.option.shipFrom.country) { throw new UserInputError('ShipFrom zipCode required!'); }
        if (!args.option.shipFrom.description) { throw new UserInputError('ShipFrom description required!'); }
      }
    })
    .then(async () => {
      const shipFrom = args.option.shipFrom || shoclefCompany.address;
      let seller = args.option.seller || shoclefCompany.seller;
      let buyer = args.option.buyer;
      const { shipTo, package } = args.option;

      const product = {
        price: CurrencyFactory.getAmountOfMoney({ currencyAmount: args.option.product.price, currency: args.option.product.currency }).getCentsAmount(),
        currency: args.option.product.currency,
        description: args.option.product.description,
        quantity: args.option.product.quantity,
      };
      // const estimateRate = {
      //   seller, buyer, shipFrom, shipTo, packageInfo,
      // };

      return ShipEngineService.estimateRate(shipFrom, shipTo, package)
        .then(async (rates) => {
          return await Promise.all(rates.map(async (rate) => {
            rate = {
              ...rate,
              shippingAmount: {
                amount: CurrencyFactory.getAmountOfMoney({ currencyAmount: rate.shippingAmount.amount, currency: rate.shippingAmount.currency.toUpperCase() }).getCentsAmount(), 
                currency: rate.shippingAmount.currency.toUpperCase()
              },
              insuranceAmount: {
                amount: CurrencyFactory.getAmountOfMoney({ currencyAmount: rate.insuranceAmount.amount, currency: rate.insuranceAmount.currency.toUpperCase() }).getCentsAmount(), 
                currency: rate.insuranceAmount.currency.toUpperCase()
              },
              confirmationAmount:{
                amount: CurrencyFactory.getAmountOfMoney({ currencyAmount: rate.confirmationAmount.amount, currency: rate.confirmationAmount.currency.toUpperCase() }).getCentsAmount(), 
                currency: rate.confirmationAmount.currency.toUpperCase()
              },
            }
            const estimateRate = {
              seller,
              buyer,
              shipFrom,
              shipTo: {
                ...shipTo,
                state: shipTo.region
              },
              package,
              product,
              deliveryInfo: rate
            };
            return repository.deliveryEstimateRate.create(estimateRate);
          }));
        })
        .catch((err) => {
          console.log('ERROR : ', err.message);
          throw new ApolloError('Failed to calculate estimate shipping rate!', 400);
        });
    });
};
