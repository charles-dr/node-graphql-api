const path = require('path');
const { Validator } = require('node-input-validator');
const { ForbiddenError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

module.exports = async (_, { id, data = {} }, { dataSources: { repository } }) => {
	const validator = new Validator({ id, data }, {
        id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
        data: 'required'
	});

	validator.addPostRule(async (provider) => {
    Promise.all([
      repository.brand.getById(provider.inputs.id),
      data.brandCategories && data.brandCategories.length ? repository.brandCategory.getByIds(data.brandCategories) : [],
    ])
			.then(([foundBrand, brandCategories]) => {
				if (!foundBrand) {
					provider.error('id', 'custom', `Brand with id "${provider.inputs.id}" does not exist!`)
        }
        
        brandCategories.forEach((brandCategory, i) => {
          provider.error('brand', 'custom', `Brand category with id "${data.brandCategories[i]}" does not exist!`);
        })
			})
	});

	return validator.check()
		.then(async (matched) => {
			if (!matched) {
				throw errorHandler.build(validator.errors);
			}
		})
		.then(() => repository.brand.getById(id))
		.then((brand) => {
      brand.name = data.name || brand.name;
      brand.images = data.images && data.images.length ? data.images : brand.images;
      brand.brandCategories = data.brandCategories || brand.brandCategories;
      brand.productCategories = data.productCategories || brand.productCategories;
      brand.hashtags = data.hashtags || brand.hashtags;
			return brand.save();
    })
    .catch(error => { 
      console.log('error', error);
      throw errorHandler.build([error]);
    })
		// .then((savePhrase) => savePhrase)
}
