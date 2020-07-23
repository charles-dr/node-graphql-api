const { UserInputError, ApolloError } = require('apollo-server');

module.exports = (_, args, { user, dataSources: { repository } }) => repository.user.load(args.user)
  .then((bannedUser) => {
    if (!bannedUser) {
      throw new UserInputError('User does not exists', { invalidArgs: 'user' });
    }

    return repository.user.addToBlackList(user.id, bannedUser.id);
  })
  .then(() => true)
  .catch((error) => {
    throw new ApolloError(`Failed to block user. Original error: ${error.message}`, 400);
  });
