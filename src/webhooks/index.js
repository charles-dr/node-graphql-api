const express = require('express');
const bodyParser = require('body-parser');
const morganBody = require('morgan-body');
const logger = require('../../config/logger');


const paymentWireCardAction = require('./payment/wirecard');
const deliveryShipEngineAction = require('./delivery/shipengine');
const getStripeAction = require('./payment/stripe');
const getRazorpayAction = require('./payment/razorpay');
const getPayPalAction = require('./payment/paypal');
const getAlipayAction = require('./payment/alipay');
const getLinepayAction = require('./payment/linepay');
const unionpayFrontAction = require('./payment/unionpay/front-url');
const unionpayBackAction = require('./payment/unionpay/back-url');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

morganBody(app, { stream: logger.stream, noColors: true, prettify: false });

// List of included webhooks
app.post('/payment/wirecard', paymentWireCardAction);
app.get('/delivery/shipengine', deliveryShipEngineAction);
app.post('/payment/stripe', getStripeAction);
app.post('/payment/razorpay', getRazorpayAction);
app.post('/payment/paypal', getPayPalAction);

app.post('/payment/alipay', getAlipayAction);
app.post('/payment/linepay', getLinepayAction);
app.post('/payment/unionpay/back-url', unionpayBackAction);
app.post('/payment/unionpay/front-url', unionpayFrontAction);

module.exports = app;
