const path = require('path');
const { Validator } = require('node-input-validator');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();


module.exports = async (_, { data }, { dataSources: { repository }, user}) => {
  const v = new Validator(data, {
    name: "required",
  })

  v.addPostRule(async pv => {
    await repository.issueCategory.getByName(pv.inputs.name)
      .then(categoryByName => {
        if (categoryByName) pv.error('name', 'custom', 'Category name already exists!');
      })
  })

  return v.check()
    .then(async (matched) => {
      if (!matched) throw errorHandler.build(v.errors);
    })
    .then(() => {
      const category = {
        name: data.name,
        notifyEmails: data.emails,
      }
      return repository.issueCategory.create(category);
    })
    .catch(error => {
      throw errorHandler.build([error]);
    })
}