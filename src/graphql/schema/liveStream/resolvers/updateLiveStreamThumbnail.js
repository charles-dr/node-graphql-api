const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError, ForbiddenError } = require('apollo-server');

const { SourceType } = require(path.resolve('src/lib/Enums'));

const logger = require(path.resolve('config/logger'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { AssetService } = require(path.resolve('src/lib/AssetService'));

const errorHandler = new ErrorHandler();


module.exports = async (_, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(args, {
    id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
    thumbnailId: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']]
  });

  validator.addPostRule(async (provider) =>
    Promise.all([
      repository.liveStream.load(provider.inputs.id),
      repository.asset.load(provider.inputs.thumbnailId),
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
    })
  );

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
      return Promise.all([
        repository.liveStream.load(args.id),
        repository.asset.getById(args.thumbnailId),
      ]);
    })
    .then(async ([liveStream, thumbnail]) => {
      if (thumbnail &&  (
        !thumbnail.resolution ||
        (thumbnail.resolution.width && thumbnail.resolution.width > 500))) {
        await AssetService.resizeImage({ assetId: args.data.thumbnail, width: 500 });
      }
      liveStream.thumbnail = args.thumbnailId;
      return liveStream.save();
    })
    .catch((error) => {
      throw new ApolloError(`Failed to save preview video. Original error: ${error.message}`, 400);
    });
};
