const axios = require('axios');
const path = require('path');

const { google } = require(path.resolve('config'));

module.exports = {
  async getUserProfile(token) {
    return axios.get(`${google.oauth_uri}/userinfo?alt=json`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(({ data }) => ({
        id: data.id,
        email: data.email,
        name: data.name,
        photo: data.picture,
      }))
      .catch((error) => {
        throw new Error(error);
      });
  },
};
