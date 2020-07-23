/* eslint-disable max-len */
const path = require('path');
const { Validator } = require('node-input-validator');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

module.exports = async function purchaseOrderListByProduct(_, args, { dataSources: { repository } }) {
  const validator = new Validator(args, {
    productID: 'required',
  }, {
    productID: 'Please provide product ID',
  });

  validator.addPostRule(async (provider) => repository.product.getById(provider.inputs.productID)
    .then((product) => {
      if (!product) {
        provider.error('Product', 'custom', `Product with id "${provider.inputs.productID}" does not exist!`);
      }
    }));

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(async () => {
      const orderItems = await repository.orderItem.getByProduct(args.productID);

      if (orderItems.length === 0) {
        return [];
      }

      const orders = [];
      const orderIDs = [];


      await Promise.all(orderItems.map(async (item) => {
        await repository.purchaseOrder.getByOrderItem(item.id)
          .then((order) => {
            if (order) {
              if (!orderIDs.includes(order.id)) {
                orders.push(order);
                orderIDs.push(order.id);
              }
            }
          });
      }));

      return orders;
    });
};
