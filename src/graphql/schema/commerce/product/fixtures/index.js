/* eslint-disable no-param-reassign */
const path = require('path');
const { gql } = require('apollo-server');
const faker = require('faker');

const { Currency, WeightUnitSystem } = require(path.resolve('src/lib/Enums'));
const logger = require(path.resolve('config/logger'));

const mutation = gql`
  mutation addProduct($title: String!
    $description: String!
    $price: Float!
    $discountPrice: Float
    $quantity: Int!
    $currency: Currency!
    $assets: [ID!]!
    $category: ID!
    $weight_value: Float!
    $weight_unit: WeightUnitSystem!
    $shippingBox: ID!
    $brand: ID!) {
    addProduct(data: {
        title: $title
        description: $description
        price: $price
        discountPrice: $discountPrice
        quantity: $quantity
        currency: $currency
        assets: $assets
        category: $category
        weight: {
          value: $weight_value
          unit: $weight_unit
        }
        shippingBox: $shippingBox
        brand: $brand
    }) {
        id
        title
        description
        price {
          amount
          currency
          formatted
        }
        oldPrice {
          amount
          currency
          formatted
        }
        quantity
        weight {
          value
          unit
        }
        shippingBox {
          width
          length
          height
          label
        }
    }
  }
`;

const productsData = [
  {
    email: 'bob@domain.com',
    title: faker.name.title(),
    description: faker.lorem.sentence(),
    price: 100,
    discountPrice: 99,
    quantity: 50,
    currency: Currency.USD,
    category: 'd4e53814-d59e-46cb-8f7d-fb957a859478',
    brand: 'fff806b0-5a56-4563-bd8a-dad5c6d621e9',
    weight_value: 123.34,
    weight_unit: WeightUnitSystem.OUNCE,
  },
  {
    email: 'john@domain.com',
    title: faker.name.title(),
    description: faker.lorem.sentence(),
    price: 1000,
    discountPrice: 500,
    quantity: 50,
    currency: Currency.GBP,
    category: 'c9202423-11b3-4e40-bc37-5b89ba610d10',
    brand: 'ffaf6b2d-0b21-45d2-842f-79e4b0825c4e',
    weight_value: 10000,
    weight_unit: WeightUnitSystem.GRAM,
  },
  {
    email: 'esrael@domain.com',
    title: faker.name.title(),
    description: faker.lorem.sentence(),
    price: 777,
    quantity: 50,
    currency: Currency.INR,
    category: 'eb18acb5-280c-453f-91be-eae3e1641fd5',
    brand: 'ff2f4542-a8ec-4e13-81b2-e5860f8e8a1e',
    weight_value: 200,
    weight_unit: WeightUnitSystem.GRAM,
  },
];

module.exports.data = { messages: productsData };

module.exports.handler = async (client, context) => {
  logger.info('[fixture] Products execution!');
  context.products = [];
  return Promise.all(productsData.map((variables, index) => {
    const user = context.users[variables.email];
    const shippingBox = context.shippingBoxes[index];
    return client
      .mutate({
        mutation,
        variables: {
          ...variables,
          assets: [user.assets[0].id],
          shippingBox: shippingBox.id,
        },
        context: {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        },
      }).then(({ data: { addProduct } }) => {
        if (typeof context.users[variables.email].products === 'undefined') {
          context.users[variables.email].products = [];
        }
        context.users[variables.email].products.push(addProduct);
        context.products.push(addProduct);
      });
  }));
};
