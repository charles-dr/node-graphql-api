const path = require('path');
const express = require('express');

const app = express();
const logger = require(path.resolve('config/logger'));
const repository = require(path.resolve('src/repository'));
const checkout = require(path.resolve('src/graphql/schema/commerce/purchaseOrder/checkoutMethods'));
const { payment: { providers: { linepay } } } = require(path.resolve('config'));

// const lineBot = require("@line/bot-sdk");
// const botConfig = {
//     channelAccessToken: linepay.bot_access_token,
//     channelSecret: linepay.bot_channel_secret
// }
// const bot = new lineBot.Client(botConfig);

module.exports = async (req, res) => {
  const { events } = req.body;
  const payment = req.body.payload.payment.entity;
  console.log('LinePay Events: ', events);

  //   if(event === 'payment.captured') {
  //     console.log("💰 Payment captured!")
  //     console.log(payment)
  //     // const card = payment.card
  //     const email = payment.email
  //     const user = await repository.user.findByEmail(email)
  //     const cartItems = await repository.userCartItem.getItemsByUser(user.id)
  //     cartItems.map((item) => repository.productInventoryLog.decreaseQuantity(item.product, item.quantity));
  //     await checkout.clearUserCart(user.id, repository);
  //   } else if(event === "payment.failed") {
  //     const pID = payment.id
  //     console.log(pID)
  //   }

  res.sendStatus(200);
};
