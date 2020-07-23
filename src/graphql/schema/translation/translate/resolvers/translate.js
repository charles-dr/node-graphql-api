const uuid = require('uuid/v4');
const path = require('path');
const fs = require('fs');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');
const { Translate } = require('@google-cloud/translate').v2;

const { google } = require(path.resolve('config'));
const translation_credential = JSON.parse(fs.readFileSync(path.resolve(google.translation_credential), 'utf8'));

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { ForbiddenError } = require('apollo-server');
const errorHandler = new ErrorHandler();

const projectId = translation_credential.project_id;
const translate = new Translate({ projectId });

module.exports = async (_, { data }, { dataSources: { repository }, user }) => {
	const validator = new Validator(data, {
		to: 'required',
		text: 'required',
	});

	return validator.check()
		.then(async (matched) => {
			if (!matched) {
				throw errorHandler.build(validator.errors);
			}
		})
		.then(async () => {
			const text = data.text;
			const from = data.from ? data.from.toLowerCase() : 'en';
			const to = data.to.toLowerCase();
			const [translation] = await translate.translate(text, { from, to });
			return translation;
		})
		.catch(error => { throw errorHandler.build(error); });
}
