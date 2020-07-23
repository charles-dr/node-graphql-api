const path = require('path');
const logger = require(path.resolve('config/logger'));
const processRequest = require('./processor');

module.exports = async (req, res) => {
  logger.info(`[WEBHOOK][UNIONPAY][BACK-URL] ${req.data.orderId}`);
  return processRequest(req.body)
    .then(({ code, message }) => {
      logger.info(`[WEBHOOK][UNIONPAY][BACK-URL][DONE] ${code}:${message}`);
      return res.status(code).send(message);
    })
}


