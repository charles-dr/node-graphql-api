const path = require('path');
const axios = require('axios');
const { pythonServer, keywordServers } = require(path.resolve('config'));
const { LanguageList } = require(path.resolve('src/lib/Enums'));

const instance = axios.create({
  baseURL: pythonServer,
  timeout: 10 * 60 * 1000,
});

const instances = keywordServers.map(ipAddress => {
  return axios.create({
    baseURL: `http://${ipAddress}:5000`,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    timeout: 60 * 1000,
  });
});

module.exports = {
  async detectLanguage(text) {
    return LanguageList.ZH;
    // return instance.post('/api/detect-lang', { text })
    //   .then(({ status, data }) => {
    //     return LanguageList.ZH;
    //     // return data.lang
    //   })
  },
  async extractKeyword(text, index = 0) {
    index = index % keywordServers.length;
    return instances[index].post('/api/keywords', { query_string: text })
      .then(({ status, data }) => {
        if (data.staus !== undefined && data.status === false) {
          throw Error(data.message);
        } else {
          return data;
        }
      })
  },
}

