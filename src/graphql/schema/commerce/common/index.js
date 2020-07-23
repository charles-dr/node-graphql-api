const { gql } = require('apollo-server');
const path = require('path');

const { Currency, WeightUnitSystem } = require(path.resolve('src/lib/Enums'));

const schema = gql`
    enum Currency {
      ${Currency.toGQL()}
    }

    enum WeightUnitSystem {
      ${WeightUnitSystem.toGQL()}
    }
    
    type AmountOfMoney {
      """In cents"""
      amount: Int!
      """Amount in ISO 4217 format, e.g. 1.01"""
      amountISO: Float!
      """Currency in ISO 4217 format, e.g. USD"""
      currency: Currency!
      formatted: String!
    }

    input IntRangeInput {
      min: Int
      max: Int
    }

    input AmountOfMoneyInput {
      amount: Float
      currency: Currency
    }

    input AmountOfMoneyRangeInput {
      min: AmountOfMoneyInput
      max: AmountOfMoneyInput
    }

    extend type Query {
      supportedCurrencies: [Currency]!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    supportedCurrencies: () => Currency.toList(),
  },
  AmountOfMoney: {
    amount: async (amount) => amount.getCentsAmount(),
    amountISO: async (amount) => amount.getCurrencyAmount(),
    currency: async (amount) => amount.getCurrency(),
    formatted: async (amount) => amount.getFormatted(),
  },
};
