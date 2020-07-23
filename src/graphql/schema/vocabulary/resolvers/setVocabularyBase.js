const path = require('path');
const { Validator } = require('node-input-validator');

const { translate_ggl: translate } = require(path.resolve('src/lib/TranslateService'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

const activity = {
  getJsonFromFile: (stream) => {
    const chunks = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => {
        const content = Buffer.concat(chunks).toString('utf8');
        resolve(JSON.parse(content));
      });
    })
  },
}

module.exports = async (_, { lang, file }, { dataSources: { repository }, user }) => {
  const { createReadStream, mimetype, filename } = await file;
  const fileStream = createReadStream();

  const v = new Validator({ lang }, {
    lang: 'required',
  });

  // await repository.vocabulary.deleteAll();
  return v.check()
    .then((matched) => {
      if (!matched) throw errorHandler.build(v.errors);
      return Promise.all([
        repository.vocabulary.getAll(),
        activity.getJsonFromFile(fileStream),
      ]);
    })
    .then(([vocabs, template]) => {
      const list_keys = Object.keys(template);
      const existing_keys = vocabs.map((vocab) => vocab.key);
      const new_keys = list_keys.filter((key) => !existing_keys.includes(key));

      // insert new vocabulary for new keys.
      return Promise.all(new_keys.map((key) => repository.vocabulary.create({
        key: key,
        translations: {
          [lang]: template[key]
        },
      })))
    })
    .then(() => repository.vocabulary.getAll())
    .catch((error) => {
      console.log('[Error]', error)
      return false;
    })
}
