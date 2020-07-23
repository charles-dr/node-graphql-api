const path = require('path');

const logger = require(path.resolve('config/logger'));

module.exports = async (purchaseOrder) => {
  // here can be some logic for case when it's failed
  logger.info(`[PURCHASE_ORDER_FAIL_FLOW][${purchaseOrder.id}] payment is failed!`);
};
