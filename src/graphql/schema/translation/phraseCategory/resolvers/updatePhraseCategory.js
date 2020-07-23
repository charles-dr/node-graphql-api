const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { ForbiddenError } = require('apollo-server');

const errorHandler = new ErrorHandler();


const fetchCategoryLevel = async (parentId, repository) => {
	if (!parentId) return 1;
	return repository.phraseCategory.getById(parentId)
		.then(parent => {
			return parent ? parent.level + 1 : 1;
		})
		.catch(error => {
			return 1;
		});
}


module.exports = async (_, args, { dataSources: { repository }, user }) => {
	const validator = new Validator(args, {});

	if (args.parent) {
		validator.addPostRule(async (provider) => repository.phraseCategory.getById(provider.inputs.parent)
			.then((parentCategory) => {
				if (!parentCategory) {
					provider.error('parent', 'custom', `Category with id "${provider.inputs.parent}" does not exist!`);
				}
			}));
	}

	return validator.check()
		.then(async (matched) => {
			if (!matched) {
				throw errorHandler.build(validator.errors);
			}
		})
		.then(() => repository.phraseCategory.getById(args.id))
		.then(async (categoryData) => {
			if (!categoryData) {
				throw new UserInputError(`Category with id "${args.id}" does not exist!`, { invalidArgs: 'id' });
			}
			if (args.name) {
				categoryData.name = args.name;
			}
			if (args.parent) {
				categoryData.level = await fetchCategoryLevel(args.parent, repository);
				categoryData.parent = args.parent || null;
				categoryData.parents = await repository.phraseCategory.fetchParents(args.parent || null);
			}
			// console.log('[Before save]', categoryData);
			return categoryData.save();
		})
		.then(() => repository.phraseCategory.reindex())
		.then(() => repository.phraseCategory.getById(args.id));
}
