/* eslint-disable no-param-reassign */
const path = require('path');
const { gql } = require('apollo-server');
const faker = require('faker');

const { SizeUnitSystem } = require(path.resolve('src/lib/Enums'));
const logger = require(path.resolve('config/logger'));

const mutation = gql`
  mutation addShippingBox($label: String!, $width: Float!, $height: Float!, $length: Float!, $unit: SizeUnitSystem!) {
    addShippingBox(data: {
        label: $label,
        width: $width,
        height: $height,
        length: $length,
        unit: $unit,
    }) {
        id
        label
        width
        height
        length
        unit
    }
  }
`;

const shippingBoxesData = [
  {
    email: 'bob@domain.com',
    label: faker.random.word(),
    width: faker.random.number(100),
    height: faker.random.number(100),
    length: faker.random.number(100),
    unit: SizeUnitSystem.INCH,
  },
  {
    email: 'bill@domain.com',
    label: faker.random.word(),
    width: faker.random.number(100),
    height: faker.random.number(100),
    length: faker.random.number(100),
    unit: SizeUnitSystem.INCH,
  },
  {
    email: 'john@domain.com',
    label: faker.random.word(),
    width: faker.random.number(100),
    height: faker.random.number(100),
    length: faker.random.number(100),
    unit: SizeUnitSystem.CENTIMETER,
  },
  {
    email: 'esrael@domain.com',
    label: faker.random.word(),
    width: faker.random.number(100),
    height: faker.random.number(100),
    length: faker.random.number(100),
    unit: SizeUnitSystem.CENTIMETER,
  },
];

module.exports.data = { shippingBoxes: shippingBoxesData };

module.exports.handler = async (client, context) => {
  logger.info('[fixture] Shipping Box execution!');
  context.shippingBoxes = [];
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
      }).then(({ data: { addShippingBox } }) => {
        context.shippingBoxes.push(addShippingBox);
      });
  }));
};
