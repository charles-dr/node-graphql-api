const path = require('path');
const repository = require(path.resolve('src/repository'));
const { payment } = require(path.resolve('config'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));


const stripe = require("stripe")(payment.providers.stripe.secret);

const invoiceService = {
    async generateInvoicePDF(pid, cartItems) {
        let items = []
        const paymentIntent = await stripe.paymentIntents.retrieve(pid)
        const orderDate = new Date(paymentIntent.created * 1000).toDateString()
        const order = await repository.purchaseOrder.getByClientSecret(paymentIntent.client_secret)
        const buyer = await repository.user.getById(order.buyer)
        const payment_method = await repository.paymentMethod.getById(order.payments[0])
        const payment_method_type = paymentIntent.payment_method_types[0]
        const currency = paymentIntent.currency.toUpperCase()
        await Promise.all(cartItems.map(async (cartItem) => {
            const product = await repository.product.getById(cartItem.product) 
            const seller = await repository.user.getById(product.seller)
            const price = await CurrencyFactory.getAmountOfMoney({
                centsAmount: product.deliveryPrice,
                currency: product.currency,
            })

            // items.push({
            //     name: product.title,
            //     seller: ,
            //     delivery_estimate: '',
            //     price: '',
            //     quantity: cartItem.,
            //     total: ''
            // })
        }))
        console.log(paymentIntent)
        return paymentIntent
    }
}

module.exports = invoiceService
