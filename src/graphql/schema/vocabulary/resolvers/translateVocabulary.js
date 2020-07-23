const path = require('path');
const { Validator } = require('node-input-validator');

const { translate_ggl: translate } = require(path.resolve('src/lib/TranslateService'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

const defaultLang = 'EN';

const activity = {
  translateIntoLang: async ({ template, lang }) => {
    const batch = 10;
    const keys = Object.keys(template);
    const translated = {};
    for (let i = 0; i < Math.ceil(keys.length / batch); i++) {
      await Promise.all(keys.slice(i * batch, (i + 1) * batch).map(async (key) => {
        translated[key] = await translate(lang.toLowerCase(), template[key]);
      }));
    }
    return translated;
  },
}


module.exports = async (_, { lang }, { dataSources: { repository } }) => {
  const v = new Validator({ lang }, {
    lang: 'required',
  });

  return v.check()
    .then((matched) => {
      if (!matched) throw errorHandler.build(v.errors);
      return repository.vocabulary.getAll();
    })
    .then(async (vocabs) => {
      const nontranslatedKeys = vocabs.filter((vocab) => !vocab.translations[lang]).map((vocab) => vocab.key);
      const objToTranslate = {};
      nontranslatedKeys.forEach((key) => {
        const [vocab] = vocabs.filter((v) => v.key === key);
        objToTranslate[key] = vocab.translations[defaultLang];
      });
      const translated = await activity.translateIntoLang({ template: objToTranslate, lang });

      return Promise.all(vocabs.map((vocab) => {
        if (nontranslatedKeys.includes(vocab.key)) {
          vocab.translations = { ...vocab.translations, [lang]: translated[vocab.key] };
          return vocab.save();
        }
        return vocab;
      }));
    });
}


