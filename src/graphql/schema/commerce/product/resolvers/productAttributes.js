/* eslint-disable no-param-reassign */
const path = require('path');
const { Promise } = require('bluebird');

const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));

const { Currency } = require('../../../../../lib/Enums');

module.exports = async (_, { productId }, { dataSources: { repository } }) => {
    return Promise.all([
        repository.product.getById(productId),
    ])
    .then(async ([ product ]) => {
        var attributes = [];
        if (product.attrs != null && product.attrs.length > 0) {
            attributes = await repository.productAttributes.getByIds(product.attrs);
            await Promise.all(attributes.map(async (attr, index) => {
                attributes[index].asset = await repository.asset.getById(attr.asset);
            }));
        }
        return attributes;
    });
};
