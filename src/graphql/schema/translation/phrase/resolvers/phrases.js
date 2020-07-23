const path = require('path');

module.exports = async (_, { filter = {}, page = {}, sort = {} }, { dataSources: { repository } }) => {
	const pager = {
		limit: page.limit,
		skip: page.skip,
		total: 0
	};
	
	if (filter.category) {
		const categories = [...filter.categories];
		await Promise.all(categories.map(async (category) =>{
			await repository.phraseCategory.getByParent(category)
			.then((subcategories) => {
				if (subcategory.length > 0) {
					subcategories.map(item => {
						filter.categories.push(item.id);
					})
				}
			})
		}));
	}

	return Promise.all([
		repository.phrase.get({ filter, page, sort }),
		repository.phrase.getTotal(filter),
	])
	.then(([collection, total]) => ({
		collection,
		pager: {...pager, total}
	}));
}

