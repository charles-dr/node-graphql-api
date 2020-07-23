const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { StreamChannelStatus } = require(path.resolve('src/lib/Enums'));

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository } }) => {
  const validator = new Validator(args, {
    id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
    hide: 'required',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
      return repository.liveStream.load(args.id);
    })
    .then((liveStream) => {
      if (!liveStream) {
        throw new UserInputError(`Live Stream ${args.id} does not exist`, { invalidArgs: 'id' });
      }

      return repository.liveStream.updateStatus(liveStream.id, args.hide ? StreamChannelStatus.CANCELED : StreamChannelStatus.ARCHIVED)
        .then(async (updatedLiveStream) => {
          // eslint-disable-next-line no-return-await
          return repository.streamChannel.updateStatus(updatedLiveStream.channel, args.hide ? StreamChannelStatus.CANCELED : StreamChannelStatus.ARCHIVED)
            .then(() => (updatedLiveStream))
            .catch(error => {
              throw new ApolloError(`Failed to archive Live Stream. Original error: ${error.message}`, 400);
            })
        })
        .catch((error) => {
          throw new ApolloError(`Failed to archive Live Stream. Original error: ${error.message}`, 400);
        })
    })
    .catch((error) => {
      throw new ApolloError(`Failed to archive Live Stream. Original error: ${error.message}`, 400);
    });
};
