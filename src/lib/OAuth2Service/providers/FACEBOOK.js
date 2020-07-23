const axios = require('axios');
const querystring = require('querystring');
const path = require('path');

const { facebook } = require(path.resolve('config'));

module.exports = {
  getUserProfile(token) {
    const parameters = {
      fields: 'id,email,name,picture.width(720).height(720)',
      access_token: token,
    };

    return axios.get(`${facebook.api_uri}/me?${querystring.stringify(parameters)}`)
      .then(({ data }) => ({
        id: data.id,
        email: data.email,
        name: data.name,
        photo: data.picture.data.url,
      }))
      .catch((error) => {
        throw new Error(error);
      });
  },
};
