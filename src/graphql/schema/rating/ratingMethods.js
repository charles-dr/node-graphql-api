const { UserInputError } = require('apollo-server');

module.exports = {
  reduceLangRange: (lang) => {
    const availableLangs = ['ZH', 'JA', 'KO', 'RU'];
    return availableLangs.includes(lang) ? lang : 'EN';
  }
}

