const path = require('path');
const braintree = require(path.resolve('src/bundles/payment/providers/Braintree'));
const { ErrorHandler } = require(path.resolve("src/lib/ErrorHandler"));
const errorHandler = new ErrorHandler();

module.exports = async (_, __, { dataSources: { repository }, user }) => {
  return repository.paymentStripeCustomer.getByProvider(braintree.getName(), user.id)
    .then((customer) => braintree.generateToken(customer ? customer.customerId : null))
    .then(({ clientToken, success }) => clientToken)
}
