const express = require('express');
const bodyParser = require('body-parser');
const morganBody = require('morgan-body');
const path = require('path');
const logger = require('../../config/logger');

const translationRouters = require('./translation');
const tempRouters = require('./temp');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

morganBody(app, { stream: logger.stream, noColors: true, prettify: false });

app.use('/translation', translationRouters);



app.route('/sync').post((req, res) => require('./resolvers/syncTables')(req, res));
app.route('/sync-with-slug').post((req, res) => require('./resolvers/syncTablesWithSlug')(req, res));
app.route('/sync-with-default').post((req, res) => require('./resolvers/syncWithDefault')(req, res));
app.route('/delete/:table').delete((req, res) => require('./resolvers/deleteAllTable')(req, res));
app.route('/update-product-slug').post((req, res) => require('./resolvers/updateProductSlug')(req, res));
app.route('/update-stream-slug').post((req, res) => require('./resolvers/updateStreamSlug')(req, res));
app.route('/product-category-slug').patch((req, res) => require('./resolvers/updateProductCategorySlug')(req, res));
app.route('/product-init-hashtags').delete((req, res) => require('./resolvers/ProductInitHashtags')(req, res));

// Fix DB Errors
app.route('/fix-brand-product-category').patch((req, res) => require('./resolvers/fixProductCategoryOfBrand')(req, res));

// Translations
app.route('/translate-init-products').post((req, res) => require('./resolvers/translateInitProductFlag')(req, res));
app.route('/translate-init-attributes').post((req, res) => require('./resolvers/translateInitAttributeFlag')(req,res));
app.route('/translate-init-livestreams').post((req, res) => require('./resolvers/translateInitLiveStreamFlag')(req, res));
app.route('/translate-brands').post((req, res) => require('./resolvers/translateBrands')(req, res));
app.route('/translate-brand-categories').post((req, res) => require('./resolvers/translateBrandCategories')(req, res));
app.route('/translate-product-categories').post((req, res) => require('./resolvers/translateProductCategories')(req, res));
app.route('/translate-livestream-categories').post((req, res) => require('./resolvers/translateLiveStreamCategories')(req, res));
app.route('/translate-livestream-experiences').post((req, res) => require('./resolvers/translateLiveStreamExperiences')(req, res));
app.route('/translate-init-livestream-status').post((req, res) => require('./resolvers/liveStreamInitTranslationStatus')(req, res));


module.exports = app;
