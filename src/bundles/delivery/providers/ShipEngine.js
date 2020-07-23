const path = require('path');
const axios = require('axios');

const logger = require(path.resolve('config/logger'));
const { shipengine } = require(path.resolve('config'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { Currency } = require(path.resolve('src/lib/Enums'));

if (shipengine.api_key == null) {
  logger.warn("You didn't provided API_KEY for ShipEngine. You will not be able to work with shipping");
}

class ShipEngine {
  constructor() {
    this.headers = {
      'Content-Type': 'application/json',
      'API-Key': shipengine.api_key,
    };
  }

  async getCarriers() {
    if (this.carriers) {
      return this.carriers;
    }

    return axios.get(`${shipengine.uri}/carriers`, { headers: this.headers })
      .then(({ data }) => {
        this.carriers = data.carriers;
        return this.carriers;
      }).catch((error) => {
        logger.error(`Error happend while getting carriers from Ship Engine. Original error: ${error.response.data.errors}`);
        throw new Error(error.response.data.errors[0].message);
      });
  }

  async calculate(carriers, from, to, fromUser, toUser, product, dimensions, quantity) {
    const supportedCarriers = await this.getCarriers();
    const rateCarriers = supportedCarriers.filter((sc) => carriers.some((c) => sc.friendly_name === c.name));
    const packages = [];
    for (let i = 0; i < quantity; i++) {
      packages.push({
        weight: product.weight,
        dimensions,
      });
    }
    const body = {
      rate_options: {
        carrier_ids: rateCarriers.map((rc) => rc.carrier_id),
      },
      shipment: {
        ship_from: {
          name: fromUser.name,
          phone: fromUser.phone,
          address_line1: from.street,
          city_locality: from.city,
          state_province: from.region.replace(`${from.country}-`, ''),
          postal_code: from.zipCode,
          country_code: from.country,
          address_residential_indicator: 'no',
        },
        ship_to: {
          name: toUser.name,
          phone: toUser.phone,
          address_line1: to.street,
          city_locality: to.city,
          state_province: to.region.replace(`${to.country}-`, ''),
          postal_code: to.zipCode,
          country_code: to.country,
          address_residential_indicator: 'no',
        },
        customs: {
          contents: 'merchandise',
          non_delivery: 'return_to_sender',
          customs_items: [{
            description: product.description,
            quantity,
            value: CurrencyFactory.getAmountOfMoney({ centsAmount: product.price, currency: Currency.USD }).getCurrencyAmount(),
          }],
        },
        packages,
      },
    };

    logger.debug(`[ShipEngine] getting calculation body: ${JSON.stringify(body)}`);
    return axios.post(`${shipengine.uri}/rates`, body, { headers: this.headers })
      .then(({ data }) => {
        logger.debug(`[ShipEngine] got calculation data: ${JSON.stringify(data)}`);
        if (data.rate_response.errors && data.rate_response.errors.length > 0) {
          logger.error(`Error happend while calculating delivery from Ship Engine. Original error: ${JSON.stringify(data.rate_response.errors)}`);
          throw new Error(data.rate_response.errors[0].message);
        }
        if (data.rate_response.rates.length === 0 && data.rate_response.invalid_rates.length > 0) {
          logger.error(`Error happend while calculating delivery from Ship Engine. Original error: ${JSON.stringify(data.rate_response.invalid_rates[0].error_messages)}`);
          throw new Error(data.rate_response.invalid_rates[0].error_messages[0]);
        }

        return data.rate_response.rates.map((rate) => ({
          rate_id: rate.rate_id,
          carrier: carriers.find((c) => c.name === rate.carrier_friendly_name)._id,

          shippingAmount: rate.shipping_amount.amount,
          insuranceAmount: rate.insurance_amount.amount,
          confirmationAmount: rate.confirmation_amount.amount,
          otherAmount: rate.other_amount.amount,
          currency: rate.shipping_amount.currency.toUpperCase(),

          deliveryDays: rate.delivery_days,
          carrierDeliveryDays: rate.carrier_delivery_days,
          estimatedDeliveryDate: rate.estimated_delivery_date,
        }));
      })
      .catch((error) => {
        if (error.reponse) {
          logger.error(`Error happend while calculating delivery from Ship Engine. Original error: ${JSON.stringify(error.response.data.errors)}`);
          throw new Error(error.response.data.errors[0].message);
        }
        throw error;
      });
  }

  async oldCalculate(carriers, from, to, weight, dimensions) {
    const supportedCarriers = await this.getCarriers();
    const rateCarriers = supportedCarriers.filter((sc) => carriers.some((c) => sc.friendly_name === c.name));
    const body = {
      carrier_ids: rateCarriers.map((rc) => rc.carrier_id),
      from_address_line1: from.street,
      from_city_locality: from.city,
      from_state_province: from.region.replace(`${from.country}-`, ''),
      from_postal_code: from.zipCode,
      from_country_code: from.country,

      to_address_line1: to.street,
      to_city_locality: to.city,
      to_state_province: to.region.replace(`${to.country}-`, ''),
      to_postal_code: to.zipCode,
      to_country_code: to.country,
      confirmation: 'none',
      weight,
      dimensions,
    };
    return axios.post(`${shipengine.uri}/rates/estimate`, body, { headers: this.headers })
      .then(({ data }) => data.map((rate) => ({
        carrier: carriers.find((c) => c.name === rate.carrier_friendly_name)._id,

        shippingAmount: rate.shipping_amount.amount,
        insurance_amount: rate.insurance_amount.amount,
        confirmation_amount: rate.confirmation_amount.amount,
        other_amount: rate.other_amount.amount,
        totalAmount: rate.shipping_amount.amount + rate.insurance_amount.amount + rate.confirmation_amount.amount + rate.other_amount.amount,
        currency: rate.shipping_amount.currency.toUpperCase(),

        deliveryDays: rate.delivery_days,
        carrierDeliveryDays: rate.carrier_delivery_days,
        estimatedDeliveryDate: rate.estimated_delivery_date,
      })).filter((rate) => rate.deliveryDays))
      .catch((error) => {
        logger.error(`Error happend while calculating delivery from Ship Engine. Original error: ${JSON.stringify(error.response.data.errors)}`);
        throw new Error(error.response.data.errors[0].message);
      });
  }

  async validate(address, repository) {
    return repository.addressVerificationCache.get(address)
      .then((cache) => {
        if (cache) {
          return { status: cache.verified, messages: cache.messages };
        }

        const body = [{
          address_line1: address.street,
          city_locality: address.city,
          state_province: address.region,
          postal_code: address.zipCode,
          country_code: address.country,
        }];

        return axios.post(`${shipengine.uri}/addresses/validate`, body, { headers: this.headers })
          .then(({ data }) => {
            const result = data[0];
            const status = result.status === 'verified' || result.status === 'warning';
            const messages = result.messages.filter((m) => m.type === 'error').map((m) => m.message);
            repository.addressVerificationCache.create({
              verified: status,
              messages,
              address,
            }).then((addressCache) => {
              logger.info(`New Address Verification added to cache: ${JSON.stringify(addressCache)}`);
            }).catch((error) => {
              logger.error(`Failed to cache Address Verification. Original error: ${error.message}`);
            });

            return { status, messages };
          })
          .catch((error) => {
            logger.error(`Error happend while validation address through Ship Engine. Original error: ${JSON.stringify(error.response.data.errors)}`);
            throw new Error(error.response.data.errors[0].message);
          });
      });
  }
}

module.exports = new ShipEngine();
