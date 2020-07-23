const mongoose = require('mongoose');
const { mongo } = require('./index');
const logger = require('./logger');

module.exports.mongoClientCloseConnection = () => {
  mongoose.connection.close(() => {
    logger.info('Mongoose default connection is disconnected due to application termination');
  });
};

module.exports.mongoClientConnection = mongoose.connect(mongo.uri, {
  useCreateIndex: true,
  useUnifiedTopology: true,
  useNewUrlParser: true,
}, (error) => {
  if (error === null) {
    logger.info('Mongo connection established Successful!');
  } else {
    logger.error(`Mongo connection failed. Log: ${JSON.stringify(error)}`);
  }
});
