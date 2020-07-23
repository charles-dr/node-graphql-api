const { Error } = require('mongoose');
const path = require('path');
const checkout = require(path.resolve('src/graphql/schema/commerce/purchaseOrder/checkoutMethods'));
const { payment: { providers: { linepay } } } = require(path.resolve('config'));
const linePay = require("line-pay");
const Pay = new linePay({
    channelId: linepay.pay_channel_ID,
    channelSecret: linepay.pay_channel_secret,
    isSandbox: true
});

module.exports = async function LinePayConfirm(
    _,
    { transactionID, amount, currency },
    { dataSources: { repository }, user },
    ) {

    const confirmation = {
        transactionId: transactionID,
        amount: amount,
        currency: currency
    }

    return Pay.confirm(confirmation).then((response) => {
        if(response.returnCode === '0000')
            return response.info.orderId
        else
            throw new Error(response.message)
    }).then((id) => {
        return repository.paymentTransaction.getById(id)
            .then((transaction) => repository.userCartItem.getItemsByUser(transaction.buyer))
            .then(async (cartItems) => {
                await Promise.all(cartItems.map( async (item) => {
                    await repository.productInventoryLog.decreaseQuantity(item.product, item.quantity)
                }))
                return checkout.clearUserCart(user.id, repository);
            }).then(() => {
                return {
                    message: 'Payment Succeeded'
                }
            }).catch(e => {
                throw new Error(e.message)
            })
    })
    .catch(e => {
        return {
            message: e.message
        }
    })
};
