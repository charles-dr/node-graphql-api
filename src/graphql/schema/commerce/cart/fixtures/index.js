/* eslint-disable no-param-reassign */
const path = require('path');
const { gql } = require('apollo-server');

const logger = require(path.resolve('config/logger'));

const mutation = gql`
  mutation addProductToCart($product: ID!, $quantity: Int!) {
    addProductToCart(product: $product, quantity: $quantity) {
      items {
        ... on CartProductItem {
          product {
            id
            title
            description
          }
        }
        quantity
      }
    }
  }
`;

const cartData = [
  {
    email: 'bob@domain.com',
    quantity: 3,
  },
  {
    email: 'bill@domain.com',
    quantity: 3,
  },
  {
    email: 'john@domain.com',
    quantity: 10,
  },
  {
    email: 'esrael@domain.com',
    quantity: 5,
  },
];

module.exports.data = { carts: cartData };

module.exports.handler = async (client, context) => {
  logger.info('[fixture] Cart execution!');

  return Promise.all(cartData.map((variables) => {
    const user = context.users[variables.email];

    const product = context.products[Math.floor(Math.random() * context.products.length)].id;

    return client.mutate({
      mutation,
      variables: {
        product,
        quantity: variables.quantity,
      },
      context: {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      },
    }).then(({ data: { addProductToCart } }) => {
      context.users[variables.email].cart = addProductToCart;
    });
  }));
};
