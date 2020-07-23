const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError, ForbiddenError } = require('apollo-server');

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { providers: { ShipEngine, EasyPost } } = require(path.resolve('src/bundles/delivery'));
const { MarketType } = require(path.resolve('src/lib/Enums'));

const errorHandler = new ErrorHandler();

const activity = {
  getDeliveryPrice(rate, organization, deliveryAddress, product) {
    if (product.freeDeliveryTo
      && product.freeDeliveryTo.length > 0
      && (organization.address.country === deliveryAddress.address.country && product.freeDeliveryTo.includes(MarketType.DOMESTIC)
        || organization.address.country !== deliveryAddress.address.country && product.freeDeliveryTo.includes(MarketType.INTERNATIONAL))) {
      return 0;
    }
    return rate.rate;
    /*
      return CurrencyFactory.getAmountOfMoney({
        currencyAmount: rate.shippingAmount + rate.insuranceAmount + rate.confirmationAmount + rate.otherAmount,
        currency: rate.currency.toUpperCase(),
      }).getCentsAmount();
    */
  },
};

module.exports = async (_, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(args, {
    product: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
    quantity: ['required', 'integer'],
    deliveryAddress: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      return Promise.all([
        repository.product.getById(args.product),
        repository.deliveryAddress.getById(args.deliveryAddress),
      ]);
    })
    .then(([product, deliveryAddress]) => {
      if (!product) {
        throw new UserInputError('Product does not exist!', { invalidArgs: 'product' });
      }

      if (!deliveryAddress) {
        throw new UserInputError('Delivery Address does not exist', { invalidArgs: 'deliveryAddress' });
      }

      if (!deliveryAddress.address.isDeliveryAvailable) {
        throw new UserInputError('Delivery Address is not valid for deliverance', { invalidArgs: 'deliveryAddress' });
      }
      return Promise.all([
        repository.organization.getByUser(product.seller),
        repository.shippingBox.findOne(product.shippingBox),
        repository.user.getById(product.seller),
      ])
        .then(([organization, shippingBox, seller]) => {
          if (!organization) {
            throw new UserInputError('Product has no proper seller', { invalidArgs: 'product' });
          }

          if (!shippingBox) {
            throw new UserInputError('Product has no Shipping Box', { invalidArgs: 'product' });
          }

          if (!organization.address) {
            throw new UserInputError('Organization did not specified an address to deliver from', { invalidArgs: 'product' });
          }

          if (!organization.address.isDeliveryAvailable) {
            throw new UserInputError('Product is not valid for deliverance', { invalidArgs: 'product' });
          }

          if (!organization.carriers || organization.carriers.length === 0) {
            if (!product.customCarrier) { throw new UserInputError('Seller has not sellected any carrier', { invalidArgs: 'product' }); }
          }

          if (!seller.name || !seller.phone) {
            throw new Error('Seller account has no username or phone specified');
          }

          // if (!user.name || !user.phone) {
          //   throw new Error('Your account has no username or phone specified');
          // }
          const carrierAccountIds = [];
          const carrierIds = {};

          if (product.customCarrier) {
            let amount = product.customCarrierValue;
            if (organization.address.country === deliveryAddress.address.country && product.freeDeliveryTo.includes(MarketType.DOMESTIC)
              || organization.address.country !== deliveryAddress.address.country && product.freeDeliveryTo.includes(MarketType.INTERNATIONAL)) { amount = 0; }
            const customCarrierDelivery = repository.deliveryRateCache.create(
              {
                shipmentId: null,
                service: null,
                carrier: product.customCarrier,
                deliveryDateGuaranteed: false,
                deliveryAddress: deliveryAddress._id,
                rate_id: null,
                deliveryDays: null,
                estimatedDeliveryDate: null,
                amount: amount.toFixed(2),
                currency: product.currency,
              },
            );
            return [customCarrierDelivery];
          }

          return repository.carrier.loadList(organization.carriers).then((carriers) => {
            carriers.map((carrierItem) => {
              carrierAccountIds.push(carrierItem.carrierId);
              carrierIds[carrierItem.carrierId] = carrierItem._id;
            });
            const fromAddressId = organization.address.addressId ? organization.address.addressId : user.address.addressId; //biwu? maybe seller.address.addressId
            return EasyPost.calculateRates({
              fromAddress: fromAddressId, toAddress: deliveryAddress.address.addressId, parcelId: shippingBox.parcelId, carrierAccountIds,
            }).then((response) => {
              const { rates } = response;
              rates.forEach((rate) => {
                rate.rate = activity.getDeliveryPrice(rate, organization, deliveryAddress, product);
              });
              return Promise.all(rates.map((rate) => {
                const {
                  id, shipment_id, service, delivery_date_guaranteed, delivery_days, delivery_date, rate: rateAmount, currency, carrier_account_id,
                } = rate;

                return repository.deliveryRateCache.create(
                  {
                    shipmentId: shipment_id,
                    service,
                    carrier: carrierIds[carrier_account_id],
                    deliveryDateGuaranteed: delivery_date_guaranteed,
                    deliveryAddress: deliveryAddress._id,
                    rate_id: id,
                    deliveryDays: delivery_days,
                    estimatedDeliveryDate: delivery_date,
                    amount: (rateAmount * 100).toFixed(2), //biwu? maybe need to consider quantity?
                    currency,
                  },
                );
              }));
            }).catch((error) => {
              throw new ApolloError(`Failed to calculate rates. Original error: ${error.message}`, 400);
            });
          });
        });
    })
    .catch((error) => {
      throw new ApolloError(`Failed to calculate delivery. Original error: ${error.message}`, 400);
    });
};
