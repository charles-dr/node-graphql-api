const path = require('path');
const { Validator } = require('node-input-validator');
const { ForbiddenError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

module.exports = async (_, { id }, { dataSources: { repository } }) => {
	const validator = new Validator({ id }, {
		id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
	});

	validator.addPostRule(async (provider) => {
		repository.phrase.getById(provider.inputs.id)
			.then((foundPhrase) => {
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
			phrase.isDeleted = true;
			return phrase.save();
		})
		.then((savePhrase) => savePhrase.isDeleted)
		.catch((error) => {
			return false
		});
}
