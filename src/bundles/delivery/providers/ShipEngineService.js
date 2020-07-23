const path = require('path');
const axios = require('axios');

const logger = require(path.resolve('config/logger'));
const { shipengine } = require(path.resolve('config'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { Currency } = require(path.resolve('src/lib/Enums'));
const ShipEngine = require('shipengine');

if (shipengine.api_key == null) {
  logger.warn("You didn't provided API_KEY for ShipEngine. You will not be able to work with shipping");
}

class ShipEngineService {
  constructor() {
    this.headers = {
      'Content-Type': 'application/json',
      'API-Key': shipengine.api_key,
    };
    this.engine = new ShipEngine.ShipEngine(shipengine.api_key);
  }

  async getCarriers() {
    return this.engine.getCarriers()
      .then(({ carriers }) => (carriers))
      .catch((err) => {
        throw new Error('Failed to get carrier list!');
      });
  }

  async createLabel(seller, buyer, shipFrom, shipTo, packageInfo, deliveryInfo, product) {
    console.log(seller);
    const ship_from = new ShipEngine.Address(seller.name, shipFrom.city, shipFrom.state, shipFrom.zipCode, shipFrom.country, shipFrom.street_1, shipFrom.street_2, seller.phone);
    const ship_to = new ShipEngine.Address(buyer.name, shipTo.city, shipTo.state, shipTo.zipCode, shipTo.country, shipTo.street, "", buyer.phone);
    const price = CurrencyFactory.getAmountOfMoney({ centsAmount: product.price, currency: product.currency }).getCurrencyAmount()
    const parcel = new ShipEngine.Package(
      {
        unit: packageInfo.weight.unit,
        value: packageInfo.weight.value,
      },
      {
        unit: packageInfo.dimensions.unit, 
        length: packageInfo.dimensions.length, 
        width : packageInfo.dimensions.width, 
        height: packageInfo.dimensions.height,
      }
    );
    const shipment = new ShipEngine.Shipment({
      ship_to, 
      ship_from,
      packages: [parcel], 
      validate_address: "no_validation",
      confirmation: "none",
      customs: {
        contents: 'merchandise',
        non_delivery: 'return_to_sender',
        customs_items: [
          {
            description: product.description,
            quantity: product.quantity,
            value: {
              currency: product.currency,
              amount: price 
            },
            harmonized_tariff_code: null,
            country_of_origin: "US",
            unit_of_measure: null,
            sku: 4700290842684,
            sku_description: null
          }
        ]
      },
      service_code: deliveryInfo.serviceCode,
      carrier_id: deliveryInfo.carrierId,
      carrier_name: deliveryInfo.carrierName,
      carrier_code: deliveryInfo.carrierCode,
    });
    return this.engine.createLabel(shipment, "pdf").then(data => {
      return data;
    }).catch(err => {
      throw new Error(err.message);
    })
  }

  async createLabelFromRate(rate_id) {
    return this.engine.createLabelFromRate(rate_id).then(data => {
      return data;
    }).catch(err => {
      throw new Error(JSON.stringify(err.response));
    })
  }

  async estimateRate(shipFrom, shipTo, packageInfo) {
    const parcel = new ShipEngine.Package(
      {
        unit: packageInfo.weight.unit,
        value: packageInfo.weight.value,
      },
      {
        unit: packageInfo.dimensions.unit,
        length: packageInfo.dimensions.length,
        width: packageInfo.dimensions.width,
        height: packageInfo.dimensions.height,
      },
    );
    const ship_from = {
      country_code: shipFrom.country,
      postal_code: shipFrom.zipCode,
    };
    const ship_to = {
      country_code: shipTo.country,
      postal_code: shipTo.zipCode,
      city_locality: shipTo.city,
      state_provice: shipTo.state,
    };

    const carrier_ids = await this.getCarriers()
      .then((carriers) => carriers.map((carrier) => (carrier.carrier_id)));

    const estimateRates = [];

    await Promise.all(carrier_ids.map(async (carrier_id) => this.engine.estimateRate(
      {
        carrier_id,
        ship_from,
        ship_to,
        confirmation: 'none',
        address_residential_indicator: 'no',
      },
      parcel,
    ).catch((err) => {
      console.log('Error to estimage rate!');
      console.log(err.message);
      return null;
    })))
      .then(async (res) => {
        if (res) {
          return await Promise.all(res.map((carrier) => {
            carrier.map((item) => {
              if (item.shipping_amount) {
                estimateRates.push({
                  carrierId: item.carrier_id,
                  shippingAmount: item.shipping_amount,
                  insuranceAmount: item.insurance_amount,
                  confirmationAmount: item.confirmation_amount,
                  otherAmount: item.amount,
                  shipDate: item.ship_date,
                  deliveryDays: item.delivery_days,
                  carrierDeliveryDays: item.carrier_delivery_days,
                  carrierName: item.carrier_friendly_name,
                  carrierCode: item.carrier_code,
                  serviceType: item.service_type,
                  serviceCode: item.service_code,
                });
              } else {
                console.log('Error message: ', item);
              }
            });
          }));
        }
        return null;
      });
    return estimateRates;
  }

  async calculate(carriers, from, to, fromUser, toUser, product, dimensions, quantity) {
    const supportedCarriers = await this.getCarriers();
    const rateCarriers = carriers.length > 0 ? supportedCarriers.filter((sc) => carriers.some((sc) => sc.carrier_code === 'apc')) : supportedCarriers;
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
            value: {
              currency: 'usd',
              amount: CurrencyFactory.getAmountOfMoney({ centsAmount: product.price, currency: Currency.USD }).getCurrencyAmount(),
            },
            harmonized_tariff_code: null,
            country_of_origin: 'US',
            unit_of_measure: null,
            sku: 4700290842684,
            sku_description: null,
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
          carrier: rate.carrier_friendly_name,
          // carrier: carriers.find((c) => c.name === rate.carrier_friendly_name)._id,

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
        // carrier: carriers.find((c) => c.name === rate.carrier_friendly_name)._id,
        carrier: rate.carrier_friendly_name,

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

  async addressValidate(address) {
    return axios.post(`${shipengine.uri}/addresses/validate`,
      [{
        address_line1: address.street,
        city_locality: address.city,
        state_province: address.region,
        postal_code: address.zipCode,
        country_code: address.country,
      }],
      { headers: this.headers })
      .then(({ data }) => {
        console.log('***************************', JSON.stringify(data));

        const result = data[0];
        const status = result.status === 'verified' || result.status === 'warning';
        return { status, address };
      })
      .catch((error) => {
        logger.error(`Error happend while validation address through Ship Engine. Original error: ${JSON.stringify(error.response.data.errors)}`);
        throw new Error(error.response.data.errors[0].message);
      });
  }
}

module.exports = new ShipEngineService();
