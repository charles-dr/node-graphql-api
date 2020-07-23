const CountryLanguage = require('country-language');
const languages = CountryLanguage.getLanguages();
const path = require('path');
const { LanguageList } = require(path.resolve('src/lib/Enums'));

const convertLangCode3to2 = (langCode) => {
  langCode = langCode.toLowerCase();
  if (langCode === 'chn' || langCode === 'chi') return 'ZH';
  let newCode;
  if (langCode.length === 3) {
    const [match] = languages.filter(lang => lang.iso639_2en === langCode || lang.iso639_3 === langCode);
    newCode = match ? match.iso639_1.toUpperCase() : 'EN';
  } else {
    newCode = langCode;
  }
  return LanguageList.toList().includes(newCode) ? newCode : 'EN';
}

const convertLangCode2to3 = (langCode) => {
    langCode = langCode.toLowerCase();
    const [match] = languages.filter(lang => lang.iso639_1 === langCode);
    return match ? match.iso639_2en == '' ? match.iso639_3.toUpperCase() : match.iso639_2en.toUpperCase() : langCode.toUpperCase();
}

module.exports = {
    convertLangCode3to2,
    convertLangCode2to3
};
