/* eslint-disable no-param-reassign */
const path = require('path');
const { gql } = require('apollo-server');

const { Currency, PushNotification, MeasureSystem, LanguageList } = require(path.resolve('src/lib/Enums'));
const logger = require(path.resolve('config/logger'));

const mutation = gql`
  mutation updateUserSettings($pushNotifications: [PushNotification]!, $language: LanguageList!, $currency: Currency!, $measureSystem: MeasureSystem!) {
    updateUserSettings(data: {
        pushNotifications: $pushNotifications,
        language: $language,
        currency: $currency,
        measureSystem: $measureSystem,
    }) {
        pushNotifications
        language
        currency
        measureSystem
    }
  }
`;

const shippingBoxesData = [
  {
    email: 'bob@domain.com',
    pushNotifications: [PushNotification.ORDERS],
    language: LanguageList.ENG,
    currency: Currency.USD,
    measureSystem: MeasureSystem.USC,
  },
  {
    email: 'bill@domain.com',
    pushNotifications: [PushNotification.ORDERS, PushNotification.PROFILE],
    language: LanguageList.ENG,
    currency: Currency.USD,
    measureSystem: MeasureSystem.SI,
  },
  {
    email: 'john@domain.com',
    pushNotifications: [],
    language: LanguageList.ENG,
    currency: Currency.GBP,
    measureSystem: MeasureSystem.SI,
  },
  {
    email: 'esrael@domain.com',
    pushNotifications: [PushNotification.PROFILE, PushNotification.CHATS],
    language: LanguageList.ENG,
    currency: Currency.INR,
    measureSystem: MeasureSystem.SI,
  },
];

module.exports.data = { shippingBoxes: shippingBoxesData };

module.exports.handler = async (client, context) => {
  logger.info('[fixture] User Settings execution!');
  return Promise.all(shippingBoxesData.map((variables) => {
    const user = context.users[variables.email];

    return client
      .mutate({
        mutation,
        variables: {
          ...variables,
        },
        context: {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        },
      }).then(({ data: { updateUserSettings } }) => {
        context.users[variables.email].settings = updateUserSettings;
      });
  }));
};
