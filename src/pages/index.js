const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const repository = require(path.resolve('src/repository'));
const unionPay = require(path.resolve('src/bundles/payment/providers/UnionPay'));

app.set('views', `${__dirname }/views`);
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/paypal/success', (req, res) => {
  res.render('paypal-success');
});
app.get('/paypal/cancel', (req, res) => {
  res.render('paypal-cancel');
});
app.get('/union-pay/txn/:id', async (req, res) => {
  const txnId = req.params.id;
  let transaction;
  return repository.paymentTransaction.getById(txnId)
    .then(paymentTransaction => {
      if (!paymentTransaction) {
        throw Object.assign(new Error('Transaction not found!'), { code: 404 });
      }
      transaction = paymentTransaction;
      const { responsePayload, amount, tags } = paymentTransaction;
      return unionPay.composeFormHTML({
        redirectTo: responsePayload.success,
        amount: amount,
        description: tags[0],
      });
    })
    .then(async ({ html, data }) => { 
      transaction.providerTransactionId = `${data.orderId}:${data.txnTime}`;
      await transaction.save();
      res.status(200).send(html)
    })
    .catch(error => {
      return res.status(error.code || 500).send(error.message);
    });
});

module.exports = app;
