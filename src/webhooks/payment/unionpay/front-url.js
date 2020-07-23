const path = require('path');
const logger = require(path.resolve('config/logger'));
const processRequest = require('./processor');

module.exports = async (req, res) => {
  logger.info(`[WEBHOOK][UNIONPAY][FRONT-URL] ${req.body.orderId}`);
  return processRequest(req.body)
    .then(({ code, message, transaction }) => {
      logger.info(`[WEBHOOK][UNIONPAY][FRONT-URL][DONE] ${code}:${message}`);
      if (code === 200) { 
        return res.redirect(transaction.responsePayload.success); 
      } else { 
        return res.status(code).send(message);
      }
    })
}
