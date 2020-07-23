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


module.exports = async (_, { data }, { dataSources: { repository }, user }) => {
	const validator = new Validator(data, {
		name: 'required',
	});

	if (data.parent) {
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
		.then(() => repository.phraseCategory.checkDuplicate(data.name, data.parent || null))
		.then((existingCategory) => {
			if (existingCategory) {
				throw new UserInputError('Name already taken', { invalidArgs: 'name' });
			}
		})
		.then(async () => {
			const categoryId = uuid();
			const categoryData = {};

			categoryData._id = categoryId;
			categoryData.name = data.name;
			categoryData.hasChildren = false;
			categoryData.level = await fetchCategoryLevel(data.parent, repository);
			categoryData.parent = data.parent || null;
			categoryData.parents = await repository.phraseCategory.fetchParents(data.parent || null);
			// console.log('[Before save]', categoryData);
			await repository.phraseCategory.add(categoryData);
			await repository.phraseCategory.reindex();
			return repository.phraseCategory.getById(categoryId);
		});
}
