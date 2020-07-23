const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError, ForbiddenError } = require('apollo-server');

const {
  StreamChannelStatus, StreamChannelType, StreamRecordStatus, StreamRole,SourceType
} = require(path.resolve('src/lib/Enums'));
const logger = require(path.resolve('config/logger'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { AgoraService } = require(path.resolve('src/lib/AgoraService'));

const errorHandler = new ErrorHandler();

async function getlivestreamsource(user,datasource,repository)
{
  return new Promise((resolve,reject)=>{
    repository.streamSource.create({source:datasource,type:SourceType.VIDEO_AUDIO,user,prerecorded:true}).then((streamsource)=>{
      resolve(streamsource);
    })
  })
}

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(args, {
    id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
    assetId: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']]
  });

  validator.addPostRule(async (provider) =>
    Promise.all([
      repository.liveStream.load(provider.inputs.id),
      repository.asset.load(provider.inputs.assetId),
    ]).then(([liveStream, asset]) => {
      if (!liveStream) {
        provider.error(
          "id",
          "custom",
          `Live stream with id "${provider.inputs.id}" does not exist!`
        );
      }
      if (!asset) {
        provider.error(
          "asset",
          "custom",
          `Asset with id "${provider.inputs.assetId}" does not exist!`
        );
      } 
      // else if (!asset.forPreview) {
      //   provider.error('asset', 'custom', `Asset is not optimized for preview video`);
      // }
    })
  );


  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
      return repository.liveStream.load(args.id);
    })
    .then(liveStream => {
      liveStream.previewVideo = args.assetId;
      return liveStream.save();
    })
    .catch((error) => {
      throw new ApolloError(`Failed to save preview video. Original error: ${error.message}`, 400);
    });
};
