const path = require('path');
const { Validator } = require('node-input-validator');
const { ForbiddenError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

const mergeTranslations = (origins = [], appends = []) => {
    let originObj = {};
    origins.forEach(origin => {
        originObj[origin.lang] = origin;
    });
    for (const append of appends) {
        originObj[append.lang] = append;
    }
    return Object.values(originObj).sort((a, b) => a.lang > b.lang ? 1 : -1);
}

module.exports = async (_, { id, translations = [] }, { dataSources: { repository } }) => {
	const validator = new Validator({ id, translations }, {
        id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
        translations: 'required'
	});

	validator.addPostRule(async (provider) => {
		repository.phrase.getById(provider.inputs.id)
			.then((foundPhrase) => {
				console.log('[foundPhrase]', foundPhrase);
				if (!foundPhrase) {
					provider.error('id', 'custom', `Phrase with id "${provider.inputs.id}" does not exist!`)
				}
			})
	});

	return validator.check()
		.then(async (matched) => {
			if (!matched) {
				throw errorHandler.build(validator.errors);
			}
		})
		.then(() => repository.phrase.getById(id))
		.then((phrase) => {
            // phrase.isDeleted = true;
            phrase.translations = mergeTranslations(phrase.translations, translations);
			return phrase.save();
		})
		.then((savePhrase) => savePhrase)
}
