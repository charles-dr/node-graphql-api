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
    const validator = new Validator(args, {
        rateid: 'required|string'
    });

    let rateInfo = {};
    validator.addPostRule(async (provider) => Promise.all([
        repository.deliveryEstimateRate.getById(provider.inputs.rateid)
    ]).then(([rate]) => {
        if (!rate)
            provider.error('rate', 'custom', `Estimated Rate with id "${provider.inputs.rateid}" does not exist!`)
        rateInfo = rate;
    }));
    
    return validator.check()
        .then(async (matched) => {
            if (!matched) {
                throw errorHandler.build(validator.errors);
            }
            const { shipFrom, shipTo, package, product, seller, buyer, deliveryInfo } = rateInfo; 
            
            return ShipEngineService.createLabel(seller, buyer, shipFrom, shipTo, package, deliveryInfo, product)
                .then(async (data) => {
                    console.log("label => ", data);
                    return repository.deliveryLabel.create(data);
                })
                .catch(err => {
                    console.log('ERROR : ', err.message);
                    throw new ApolloError('Failed to create Label!', 400);
                });
        })
};

