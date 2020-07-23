const path = require('path');
const axios = require('axios');

const { xRapidAPIConfig, internal, translationServers } = require(path.resolve('config'));
const { LanguageList } = require('./Enums');

const languages = LanguageList.toList();
console.log('[Languages]', languages);


const translateByLanguage = async (targetLang, text) => {
  if (!text) return text;
  
  const targetServer = translationServers[languages.indexOf(targetLang.toUpperCase())];
  targetLang = targetLang.toLowerCase();

  if (targetLang === 'zh') {
    targetLang = 'zh-cn';
  }

  return axios.post(
    `http://${targetServer}:5000/api/googletrans`, 
    {
      dest: targetLang,
      text,
    }, 
    {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',        
      },
      timeout: 60000,
    }
  )
    .then(({ data: {data, status} }) => data)
    .catch((err) => {
      console.log('[Translation] Failed', err.message);
      return null;
    });
}

module.exports = {
  translate(targetLang, text, sourceLang = 'auto') {
    return axios.get(
      xRapidAPIConfig,
      {
        params: {
          source: sourceLang,
          target: targetLang,
          input: text,
        },
      },
      {
        headers: {
          'x-rapidapi-key': xRapidAPIConfig.apiKey,
          'x-rapidapi-host': xRapidAPIConfig.host,
          useQueryString: true,
        },
      }
    )
      .then((response) => (response.data.outputs ? response.data.outputs[0].output : null))
      .catch((err) => {
        console.log('Translation Failed.', err.message);
        return null;
      });
  },
  translate_ggl(text) {
    return Promise.all(languages.map(lang => translateByLanguage(lang, text)))
      .then((translations) => {
        const translated = {};
        translations.forEach((translated_text, index) => translated[languages[index].toLowerCase()] = translated_text);
        return translated;
      });
  },
};
