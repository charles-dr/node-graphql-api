/* eslint-disable no-param-reassign */
const path = require('path');
const { gql } = require('apollo-server');

const logger = require(path.resolve('config/logger'));

const mutation = gql`
  mutation addDeliveryAddress($label: String!, $street: String!, $city: String!, $country: ID!, $region: ID!, $zipCode: String!) {
    addDeliveryAddress(data: {
        label: $label
        street: $street
        city: $city
        country: $country
        zipCode: $zipCode
        region: $region
    }) {
        id
        label
        street
        city
        country { id }
    }
  }
`;

const deliveryAddressData = [
  {
    email: 'bob@domain.com',
    label: 'BobMain',
    street: 'babilova 25',
    city: 'Dnepr',
    country: 'UA',
    zipCode: '49001',
    region: 'UA-71',
  },
  {
    email: 'bill@domain.com',
    label: 'BillMain',
    street: 'babilova 25',
    city: 'Dnepr',
    country: 'UA',
    zipCode: '49001',
    region: 'UA-74',
  },
  {
    email: 'john@domain.com',
    label: 'JohnMain',
    street: 'babilova 25',
    city: 'Dnepr',
    country: 'UA',
    zipCode: '49001',
    region: 'UA-61',
  },
  {
    email: 'esrael@domain.com',
    label: 'EsraeilMain',
    street: 'babilova 25',
    city: 'Dnepr',
    country: 'UA',
    zipCode: '49001',
    region: 'UA-05',
  },
];

module.exports.data = { deliveryAddresses: deliveryAddressData };

module.exports.handler = async (client, context) => {
  logger.info('[fixture] Delivery Address execution!');
  return Promise.all(deliveryAddressData.map((variables) => {
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
      }).then(({ data: { addDeliveryAddress } }) => {
        if (typeof context.users[variables.email].deliveryAddresses === 'undefined') {
          context.users[variables.email].deliveryAddresses = [];
        }
        context.users[variables.email].deliveryAddresses.push(addDeliveryAddress);
      });
  }));
};
