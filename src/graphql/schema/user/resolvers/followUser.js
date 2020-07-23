const path = require('path');
const { Validator } = require('node-input-validator');
const { ApolloError } = require('apollo-server');
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

module.exports = async (_, { id }, { dataSources: { repository }, user}) => {
  const validator = new Validator({ id }, {
    id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
  });

  let userToFollow;
  validator.addPostRule(provider => repository.user.getById(id)
    .then(userById => {
      if (!userById) provider.error('id', 'custom', `User with id "${id}" does not exist!`);
      userToFollow = userById;
    }));
  
  return validator.check()
    .then(matched => {
      if (!matched) throw errorHandler.build(validator.errors);
    })
    .then(() => {
      const tag = userToFollow.getTagName();
      if (!user.following.includes(tag)) user.following.push(tag);
      return user.save();
    })
    .then(me => userToFollow)
    .catch((error) => {
      throw new ApolloError(`Failed to follow the user. Original error: ${error.message}`, 400);
    })
}
