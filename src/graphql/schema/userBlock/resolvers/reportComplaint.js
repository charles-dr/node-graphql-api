const { UserInputError, ApolloError } = require('apollo-server');

module.exports = (_, { data }, { user, dataSources: { repository } }) => {
  const promises = ['none', 'none', 'none'];
  if (data.user) {
    promises[0] = repository.user.load(data.user);
  }

  if (data.product) {
    promises[1] = repository.product.getById(data.product);
  }

  if (data.liveStream) {
    promises[2] = repository.liveStream.load(data.liveStream);
  }

  if (!promises.some((p) => p !== 'none')) {
    throw new UserInputError('You can not complaint none', { invalidArgs: ['user', 'product', 'liveStream'] });
  }

  return Promise.all(promises)
    .then(([bannedUser, product, liveStream]) => {
      if (!bannedUser && bannedUser !== 'none') {
        throw new UserInputError('User does not exists', { invalidArgs: 'user' });
      }

      if (!product && product !== 'none') {
        throw new UserInputError('Product does not exists', { invalidArgs: 'product' });
      }

      if (!liveStream && liveStream !== 'none') {
        throw new UserInputError('Live Stream does not exists', { invalidArgs: 'liveStream' });
      }

      return repository.reportComplaint.create({
        reporter: user.id,
        ...data,
      });
    })
    .then(() => true)
    .catch((error) => {
      throw new ApolloError(`Failed to send complaint report. Original error: ${error.message}`, 400);
    });
};
