
const path = require('path');
const { Validator } = require('node-input-validator');
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

module.exports =  async (_, { id, data }, { dataSources: { repository } }) => {
  const validator = new Validator({ ...data, id }, {
    id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
  });

  validator.addPostRule(provider => repository.brandCategory.getById(provider.inputs.id)
    .then(brandCategory => {
      if (!brandCategory) {
        provider.error('id', 'custom', `Brand Category with id "${provider.inputs.id}" doen not exist!`);
      }
    }));

  return validator.check()
    .then(matched => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
      return repository.brandCategory.getById(id);
    })
    .then(brandCategory => {
      brandCategory.name = data.name !== undefined ? data.name : brandCategory.name;
      brandCategory.isRecommended = data.isRecommended !== undefined ? data.isRecommended : brandCategory.isRecommended;
      return brandCategory.save();
    })
}
