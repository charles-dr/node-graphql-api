const path = require('path');
const axios = require('axios');
const EasyPost = require('@easypost/api');
const logger = require(path.resolve('config/logger'));
const { easyPost } = require(path.resolve('config'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { Currency } = require(path.resolve('src/lib/Enums'));

if (easyPost.api_key == null) {
  logger.warn("You didn't provided API_KEY for EasyPost. You will not be able to work with shipping");
}

const api = new EasyPost(easyPost.api_key);

class EasyPostClass {

  formatEasyPostErrors(code, message, errors) {
    let error = '';
    errors.map(({ field, message }) => error += `Field "${field}" ${message}. `)
    return `${code} - ${message} ${error}`;
  }

  async addParcel(data) {
    let length = data.length;
    let width = data.width;
    let height = data.height;
    if (data.unit == 'CENTIMETER') {
      length = data.length / 2.54; // default unit for dimensions in EasyPost is INCH
      width = data.width / 2.54;
      height = data.height / 2.54;
    }
    let weight = data.unitWeight == 'OUNCE' ? data.weight : data.weight / 28.35; // default unit for weight in EasyPost is OUNCE
    const parcel = new api.Parcel({
      length,
      width,
      height,
      weight
    });
    return parcel.save().then(response => response).catch(({ error: { error: { code, message, errors } } }
    ) => {
      let errorMessage = this.formatEasyPostErrors(code, message, errors);
      logger.error(`Error happened while adding a parcel in Easy Post. Original error: ${errorMessage}`);
      throw new Error(errorMessage);
    });
  }

  async addAddress({ phone, email, address }) {
    const addressData = new api.Address({
      verify: [
        "delivery"
      ],
      street1: address.street,
      street2: address.description || null,
      city: address.city,
      state: address.region,
      zip: address.zipCode || null,
      country: address.country,
      phone: phone || null,
      email: email || null
    });
    return addressData.save().then(response => response).catch(({ error: { error: { code, message, errors } } }
    ) => {
      let errorMessage = this.formatEasyPostErrors(code, message, errors);
      logger.error(`Error happened while adding address in Easy Post. Original error: ${errorMessage}`);
      throw new Error(errorMessage);
    })
  }

  async updateAddress({ address }) {
    let data = api.Address.retrieve(address.addressId).then(response => response);
    const addressData = new api.Address({
      verify: [
        "delivery"
      ],
      street1: address.street,
      street2: address.description || null,
      city: address.city,
      state: address.region,
      zip: address.zipCode || null,
      country: address.country,
      phone: data.phone || null,
      email: data.email || null
    });
    return addressData.save().then(response => response).catch(({ error: { error: { code, message, errors } } }
    ) => {
      let errorMessage = this.formatEasyPostErrors(code, message, errors);
      logger.error(`Error happened while adding address in Easy Post. Original error: ${errorMessage}`);
      throw new Error(errorMessage);
    })
  }

  async calculateRates({ fromAddress, toAddress, parcelId, carrierAccountIds }) {
    const shipment = new api.Shipment({
      to_address: toAddress,
      from_address: fromAddress,
      parcel: parcelId,
      carrier_accounts: carrierAccountIds,
      customs_info: {
        "eel_pfc": "NOEEI 30.37(a)",
        "customs_certify": true,
        "customs_signer": "Steve Brule",
        "contents_type": "merchandise",
        "contents_explanation": "",
        "restriction_type": "none",
        "restriction_comments": "",
        "non_delivery_option": "abandon"
      }
    });

    return shipment.save().then(response => response).catch(({ error: { error: { code, message, errors } } }
    ) => {
      let errorMessage = this.formatEasyPostErrors(code, message, errors);
      logger.error(`Error happened while calculating rates in Easy Post. Original error: ${errorMessage}`);
      throw new Error(errorMessage);
    });
  }
}

module.exports = new EasyPostClass();
