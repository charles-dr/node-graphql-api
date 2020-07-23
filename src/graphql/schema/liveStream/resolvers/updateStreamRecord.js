const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError, ForbiddenError } = require('apollo-server');

const {
  SourceType
} = require(path.resolve('src/lib/Enums'));
const logger = require(path.resolve('config/logger'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { AgoraService } = require(path.resolve('src/lib/AgoraService'));
const { AssetService } = require(path.resolve('src/lib/AssetService'));

const errorHandler = new ErrorHandler();

const checkAndCreateStreamSource = async (user, source, repository) => {
  return repository.streamSource.getAll({ user, type: SourceType.VIDEO_AUDIO, source, prerecorded: true })
    .then(([ streamSource ]) => {
      return streamSource ? streamSource : repository.streamSource.create({
        user,
        type: SourceType.VIDEO_AUDIO,
        source,
        prerecorded: true,
      });
    });
}

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(args, {
    liveStream: 'required',
    streamRecord: 'required',
  });

  let foundLiveStream;

  validator.addPostRule(provider => repository.liveStream.load(args.liveStream)
    .then(liveStream => {
      if (!liveStream) provider.error("id", "custom", `Live stream with id "${provider.inputs.id}" does not exist!`);
      foundLiveStream = liveStream;
    })
  );

  return validator.check()
    .then((matched) => {
      if (!matched) throw errorHandler.build(validator.errors);
      return repository.streamChannel.load(foundLiveStream.channel);
    })
    .then(async (streamChannel) => {
      if (!streamChannel) throw new Error('Stream channel does not exist!');
      
      return Promise.all(args.streamRecord.map(source => checkAndCreateStreamSource(user, source, repository)))
        .then(streamSources => {
          streamChannel.record.sources = streamSources.map(item => item._id);
          return streamChannel.save();
        })
    })
    .then(streamChannel => foundLiveStream);
}