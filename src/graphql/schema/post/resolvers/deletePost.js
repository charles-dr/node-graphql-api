const path = require('path');
const uuid = require("uuid/v4");
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

module.exports = async (_, { id }, { dataSources: { repository }, user}) => {
  const validator = new Validator({ id }, {
    id: "required",
  })

  validator.addPostRule(provider => {
    return repository.post.getById(id)
      .then(post => {
        if (!post || post.deleted === true) {
          provider.error('id', 'custom', 'Post does not exist!');
        } else if (post.user !== user.id) {
          provider.error('id', 'custom', 'Permission denied!');
        }
      })
  })

  return validator.check()
    .then(async matched => {
      if (!matched) throw errorHandler.build(validator.errors);
      return repository.post.delete(id);
    })
    .then(() => true)
    .catch((error) => {
      throw new ApolloError(`Failed to delete Post. Original error: ${error.message}`, 400);
    });
}
