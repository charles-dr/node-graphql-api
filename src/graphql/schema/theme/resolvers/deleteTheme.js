
const uuid = require("uuid/v4");
const path = require("path");
const { Validator } = require("node-input-validator");
const { UserInputError, ApolloError } = require("apollo-server");

const { ErrorHandler } = require(path.resolve("src/lib/ErrorHandler"));
const errorHandler = new ErrorHandler();

module.exports = async (_, { id }, { dataSources: { repository }, user }) => {
  const validator = new Validator({ id }, {
    id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
  });

  validator.addPostRule(async provider => {
    await Promise.all([
      repository.theme.getById(provider.inputs.id),
    ])
    .then(([ themeById ]) => {
      if (!themeById) provider.error('id', 'custom', `Theme with id "${provider.inputs.id}" does not exist!`);
    })
  });

  return validator.check()
    .then(matched => {
      if (!matched) throw errorHandler.build(validator.errors);

      return repository.theme.deleteById(id);
    })
    .then(() => true)
    .catch((e) => {
      console.log('[Error] while deleting theme', e.message);
      return false;
    });
}
