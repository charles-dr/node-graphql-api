const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const repository = require(path.resolve('src/repository'));
const viewersUpdateAction = require('./update')
const injectAction = require('./inject')
const alterAction = require('./alter')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/',(req, res) => {
    try {
        repository.liveStream.getOne({_id: req.query._id})
            .then((liveStream) => {
                res.send({ views: liveStream.views, likes: liveStream.likes})
        });
    } catch (error) {
        console.log(error.message);
    }
});
app.get('/update', viewersUpdateAction)
app.get('/inject', injectAction)
app.get('/alter', alterAction)

module.exports = app;