const path = require('path');
const { gql } = require('apollo-server');

const { MeasureSystem, PushNotification } = require(path.resolve('src/lib/Enums'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));

const updateUserSettings = require('./resolvers/updateUserSettings');

const schema = gql`
enum PushNotification {
    ${PushNotification.toGQL()}
}

enum MeasureSystem {
    ${MeasureSystem.toGQL()}
}

type MoneyDetails {
  ISO: Currency!
  symbol: String!
}

type UserSettings {
    pushNotifications: [PushNotification]!
    language: LanguageDetails!
    moneyDetails: MoneyDetails!
    measureSystem: MeasureSystem!
}
    
input UserSettingsInput {
    pushNotifications: [PushNotification]! = []
    language: LanguageList!
    currency: Currency!
    measureSystem: MeasureSystem!
}
  
extend type Query {
  """Allows: authorized user"""
  userSettings: UserSettings! @auth(requires: USER) 
}
  
extend type Mutation {
    updateUserSettings (data: UserSettingsInput!): UserSettings! @auth(requires: USER)
}
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    userSettings: async (obj, args, { user }) => user.settings,
  },
  Mutation: {
    updateUserSettings,
  },
  UserSettings: {
    moneyDetails: async ({ currency }) => {
      const amount = CurrencyFactory.getAmountOfMoney({ centsAmount: 0, currency });
      return {
        ISO: currency,
        symbol: amount.getSymbol,
      };
    },
    language: async ({ language }, _, { dataSources: { repository } }) => (
      repository.language.getById(language)
    ),
  },
};
