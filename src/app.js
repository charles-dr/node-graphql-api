// HTTP SERVER
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');

const repository = require('./repository');
const { AgoraService } = require('./lib/AgoraService');

const { corsDomain } = require(path.resolve('config'));
const apolloServerFactory = require(path.resolve('src/graphql'));
const { mongoClientCloseConnection } = require(path.resolve('config/mongoConnection'));
const webhookRouters = require('./webhooks');
const viewersRouters = require('./viewers');

const { InvoiceService } = require(path.resolve('src/lib/InvoiceService'));
const { payment: { providers: { stripe } } } = require(path.resolve('config'));
const stripSDK = require('stripe')(stripe.secret);

const { PurchaseOrderStatus } = require(path.resolve('src/lib/Enums'));

const multiparty = require('connect-multiparty');

const multipartymiddleware = multiparty();

const async = require('async');

const { translate } = require(path.resolve('src/lib/TranslateService'));
const { LanguageList } = require(path.resolve('src/lib/Enums'));

const fs = require('fs');

const morgan = require('morgan');
const logger = require('../config/logger');

const pageRouters = require('./pages');
const ApiV1Routers = require('./api_v1');

process.on('SIGINT', () => {
  mongoClientCloseConnection();
});

const app = express();
app.use(express.json({ limit: '50000mb' }));
app.use(express.urlencoded({ limit: '50000mb', extended: true }));
// app.use(morgan('combined', { stream: logger.stream }));
const expressip = require('express-ip');

app.set('trust proxy', true);
app.use(expressip().getIpInfoMiddleware);
app.get('/health', (req, res) => {
  res.send({ status: 'pass' });
});

app.get('/translate', async (req, res) => {
  const products = await repository.product.getAll();
  const languageList = LanguageList.toList();

  const title = {};
  const description = {};
  let index = 0;
  await async.eachLimit(products, 2, async (product, cb) => {
    index++;
    const translatedProduct = await repository.productTranslation.getByProduct(product.id);

    if (!translatedProduct) {
      await Promise.all(languageList.map(async (language) => {
        const tt = await translate(language.toLowerCase(), product.title);
        const dd = await translate(language.toLowerCase(), product.description);

        title[language.toLowerCase()] = tt || product.title;
        description[language.toLowerCase()] = dd || product.description;
      }));

      await repository.productTranslation.addNewProduct({ product: product.id, title, description });
    }
    // eslint-disable-next-line no-unused-expressions
    console.log('Traslated Products: ', index);
    cb && cb(null);
  });
  res.json({ success: true });
});

app.use('/webhooks', webhookRouters);
app.use('/viewers', viewersRouters);
app.use('/pages', pageRouters);
app.use('/api/v1', ApiV1Routers);

app.route('/upload').post(multipartymiddleware, (req, res) => {
  const { file } = req.files;
  fs.readFile(file.path, (err, data) => {
    AgoraService.upload(data, (location) => {
      res.send(location);
      fs.unlink(file.path, (err) => {
        console.log('Temp File Deleted');
      });
      // AgoraService.publish(location);
    });
  });
});

app.post('/invoice', async (req, res) => {
  const orderDetails = await InvoiceService.getOrderDetails(req.body.pid, req.body.userID);
  const PDFs = [];
  await Promise.all(orderDetails.map(async (orderDetail) => {
    const url = InvoiceService.createInvoicePDF(orderDetail);
    PDFs.push(url);
  }));

  res.status(200).send(PDFs);
});
function apiRequest(options) {
  const request = require('request');
  let res = '';
  request(options, (error, response) => {
    if (error) {
      console.log('request error', error);
      return [];
    }
    try {
      res = response.body;
    } catch (e) {
      console.log('api error', response);
    }
  });
  const deasync = require('deasync');
  while (res === '') {
    deasync.runLoopOnce();
  }
  try {
    res = JSON.parse(res);
  } catch (e) {
    res = null;
  }
  // console.log('response.status',res)
  return res;
}
app.get('/location', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, x-timebase',
  );
  const { ip } = req;
  if (ip === '::ffff:127.0.0.1') {
    return res.send({ state: -1, message: 'It is not working on localhost' });
    // ip = '103.125.234.111';
  }
  const filter = {
    method: 'GET',
    url: `https://api.geoapify.com/v1/ipinfo?&ip=${ip}&apiKey=1b48259b810e48ddb151889f9ea58db0`,
    headers: {
      Accept: 'application/json',
    },
    body: '',
  };
  const locationInfo = apiRequest(filter);
  if (locationInfo === null) {
    return res.send({
      state: -2,
      message: 'Location api is not working, Please check api key',
    });
  }
  try {
    const countryCode = locationInfo.country.iso_code;
    const languageName = locationInfo.country.languages[0].name;
    const languageIOSCode = locationInfo.country.languages[0].iso_code;
    const phoneCode = locationInfo.country.phone_code;
    const { currency } = locationInfo.country;
    // const language = await repository.language.getByName(languageName);
    // console.log('req.ipInfo', req.ipInfo);
    return res.send({
      state: 0,
      location: {
        countryCode,
        phoneCode,
        currency,
        languageName,
        languageIOSCode,
        ip,
      },
    });
  } catch (e) {
    return res.send({
      state: 0,
      location: locationInfo,
    });
  }
});

app.post('/cancel', async (req, res) => {
  const paymentIntent = await stripSDK.paymentIntents.cancel(req.body.pid);
  res.send(JSON.stringify(paymentIntent));
});

app.post('/packing', async (req, res) => {
  const orderDetails = await InvoiceService.getOrderDetails(req.body.pid, req.body.userID);
  const invoicePDF = await InvoiceService.createPackingSlip(orderDetails);
  res.status(200).send(invoicePDF);
});


app.use('/terms_conditions', express.static('terms_conditions'));

app.use(cors({
  origin: corsDomain,
  optionsSuccessStatus: 200,
}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, x-timebase',
  );
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }
  next();
});

const apolloApp = express();
const apolloServer = apolloServerFactory({ repository });

apolloServer.applyMiddleware({
  app: apolloApp,
  path: '/',
  cors: corsDomain,
  disableHealthCheck: true,
});

const robots = require('./robots');

robots.startRobots();

app.use('/graphql', apolloApp);

const httpServer = createServer(app);
apolloServer.installSubscriptionHandlers(httpServer);

module.exports.httpServer = httpServer;
