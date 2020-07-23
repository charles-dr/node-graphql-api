const NodeGeocoder = require('node-geocoder');
const path = require('path');

const { google } = require(path.resolve('config'));
const logger = require(path.resolve('config/logger'));

const provider = 'google';

if (google.api_key == null) {
  logger.warn("You didn't provided API_KEY for Google Geocoder. You will not be able to decode latitude longitude");
}

const options = {
  provider,
  apiKey: google.api_key,
  formatter: null,
};

const geocoderService = NodeGeocoder(options);

module.exports.Geocoder = {
  reverse(location) {
    return geocoderService.reverse({ lat: location.latitude, lon: location.longitude })
      .then((res) => {
        if (res.length === 0) {
          throw new Error('[Geocoder] Location is invalid');
        }
        return {
          country: {
            id: res[0].countryCode.toUpperCase(),
            name: res[0].country,
          },
          street: res[0].streetNumber ? `${res[0].streetNumber} ${res[0].streetName}` : res[0].streetName,
          city: res[0].city,
          zipCode: res[0].zipcode,
        };
      });
  },

  geocode(address) {
    const addressArray = [];
    if (address.street) {
      addressArray.push(address.street);
    }
    if (address.city) {
      addressArray.push(address.city);
    }

    const query = {
      address: addressArray.join(' '),
      zipcode: address.zipCode,
    };

    if (address.region) {
      query.county = address.region.name;
    }

    if (address.country) {
      query.country = address.country.name;
    }

    return geocoderService.geocode(query)
      .then((res) => {
        if (res.length === 0) {
          throw new Error('[Geocoder] Address is invalid');
        }
        return { latitude: res[0].latitude, longitude: res[0].longitude };
      });
  },
};
