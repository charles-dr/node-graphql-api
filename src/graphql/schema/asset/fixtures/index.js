/* eslint-disable no-param-reassign */
const { gql } = require('apollo-server');
const logger = require('../../../../../config/logger');

const mutation = gql`
    mutation uploadAsset($mimetype: String!, $size: Int!) {
      addAsset(data: {mimetype: $mimetype, size: $size}) {
        id
        path
      }
    }
`;

const assetData = [
  { mimetype: 'image/jpeg', size: 1024 },
  { mimetype: 'image/jpeg', size: 1024 },
  { mimetype: 'image/jpeg', size: 1024 },
  { mimetype: 'image/jpeg', size: 1024 },
];

module.exports.data = { assets: assetData };

module.exports.handler = async (client, context) => {
  logger.info('[fixture] Assets execution!');
  const userEmails = Object.keys(context.users);

  return Promise.all(assetData.map((variables, index) => {
    const email = userEmails[index];
    const { accessToken } = context.users[email];
    return client
      .mutate({
        mutation,
        variables,
        context: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      })
      .then(({ data: { addAsset } }) => {
        if (typeof context.users[email].assets === 'undefined') {
          context.users[email].assets = [];
        }
        context.users[email].assets.push(addAsset);
      });
  }));
};
