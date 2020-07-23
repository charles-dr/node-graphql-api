
const uuid = require("uuid/v4");
const path = require("path");
const { Validator } = require("node-input-validator");
const { UserInputError, ApolloError } = require("apollo-server");
const { ThemeType } = require(path.resolve("src/lib/Enums"));

const { ErrorHandler } = require(path.resolve("src/lib/ErrorHandler"));
const errorHandler = new ErrorHandler();

module.exports = async (_, { data }, { dataSources: { repository }, user }) => {
  const validator = new Validator(data, {
    name: "required",
    values: "required",
    keyName: "required",
    displayName: "required",
  });

  validator.addPostRule(provider => repository.productVariation.loadAll({ keyName: data.keyName })
    .then((productVariations) => {
      if (productVariations.length) {
        provider.error('keyName', "custom", `Product variation with keyName "${data.keyName}" already exist!`);
      }
    })
  )

  return validator.check()
    .then(matched => {
      if (!matched) throw errorHandler.build(validator.errors);

      return repository.productVariation.create(data);
    })
}
