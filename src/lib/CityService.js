const request = require('request');
const querystring = require('querystring');
const path = require('path');

const { google } = require(path.resolve('config'));
const logger = require(path.resolve('config/logger'));

if (google.api_key == null) {
  logger.warn("You didn't provided APP_ID for Google Places API. You will not be able to work with cities");
}

module.exports.CityService = {
  getCity(city) {
    const parameters = {
      input: city,
      inputtype: 'textquery',
      language: 'en',
      fields: 'photos,geometry,name,types',
      key: google.api_key,
    };
    return new Promise((resolve, reject) => {
      request.get(`${google.places_uri}/findplacefromtext/json?${querystring.stringify(parameters)}`,
        {},
        (error, response, body) => {
          const parseData = JSON.parse(body);
          if (error) {
            return reject(new Error(error));
          }

          const candidate = parseData.candidates.find((c) => c.types.indexOf('locality') !== -1);
          if (!candidate) {
            return reject(new Error('No city found'));
          }
          return resolve({
            name: candidate.name,
            location: {
              latitude: candidate.geometry.location.lat,
              longitude: candidate.geometry.location.lng,
            },
            photo: candidate.photos[0].photo_reference,
          });
        });
    });
  },

  loadPhoto(photoReference) {
    const parameters = {
      photoreference: photoReference,
      maxheight: 600,
      key: google.api_key,
    };
    return new Promise((resolve, reject) => {
      request.get(`${google.places_uri}/photo?${querystring.stringify(parameters)}`,
        { encoding: null },
        (error, response, body) => {
          if (error) {
            reject(new Error(error));
          }
          if (response.statusCode === 403) {
            reject(new Error('Your available quota request exceeds'));
          }
          let fileType = response.headers['content-type'].replace('image/', '');
          if (fileType === 'jpeg') {
            fileType = 'jpg';
          }
          resolve({ type: fileType, buffer: body });
        });
    });
  },
};
