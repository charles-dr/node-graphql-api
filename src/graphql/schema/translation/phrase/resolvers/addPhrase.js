const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { ForbiddenError } = require('apollo-server');

const errorHandler = new ErrorHandler();

const slugify = str => {
	return str.replace(/\s+/g, '_') // collapse whitespace and replace by underscore
        .replace(/-/g, '_'); // collapse dashes and replace by underscore
}

module.exports = async (_, { data }, { dataSources: { repository } }) => {
	const validator = new Validator(data, {
		slug: "required",
		category: "required",
		translations: "required|array"
	});

	validator.addPostRule(async (provider) => Promise.all([
		repository.phraseCategory.getById(provider.inputs.category),
		repository.phrase.getBySlug(slugify(provider.inputs.slug), provider.inputs.category)
	])
		.then(([phraseCategory, existingPhrase]) => {
			if (!phraseCategory) {
				provider.error('category', 'custom', `Category with id "${provider.inputs.category}" does not exist!`);
			}
			if (existingPhrase) {
				provider.error('slug', 'custom', `Phrase slug already taken!`);
			}
		}));

	return validator.check()
		.then(async (matched) => {
			if (!matched) {
				throw errorHandler.build(validator.errors);
			}
		})
		.then(() => repository.phraseCategory.getById(data.category))
		.then((category) => {
			const phraseData = {};
			const phraseId = uuid();

			// 
			const slug = slugify(data.slug);
			const [ EngItem ] = data.translations.filter(trans => trans.lang == 'EN');
			if (!EngItem) {
				data.translations.push({
					lang: 'EN',
					text: data.slug,
				});
			}

			phraseData._id = phraseId;
			phraseData.slug = slug;
			phraseData.category = data.category;
			phraseData.translations = data.translations || [];
			return repository.phrase.add(phraseData);
		})
}
