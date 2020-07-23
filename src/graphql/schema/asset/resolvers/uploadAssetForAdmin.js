const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const AWS = require('aws-sdk');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { aws, cdn } = require(path.resolve('config'));
const MIMEAssetTypes = require(path.resolve('src/lib/MIMEAssetTypes'));

const errorHandler = new ErrorHandler();

const s3 = new AWS.S3();

module.exports = async (root, { file }, { dataSources: { repository } }) => {
  const { createReadStream, mimetype, filename } = await file;
  const fileStream = createReadStream();
  const size = 0;

  const validator = new Validator({ mimetype, size }, {
    mimetype: 'required',
    size: 'required',
  });
  validator.addPostRule(async (input) => {
    if (!MIMEAssetTypes.detect(input.inputs.mimetype)) {
      validator.addError('mimetype', 'custom', 'API does not support this mimetype');
    }
  });

  return validator.check()
    .then((matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
      const { ext, type } = MIMEAssetTypes.detect(mimetype);
      const id = uuid();
      const path = `${ext}/${id}.${ext}`;

      return Promise.all([
        s3.upload({
          Bucket: aws.user_bucket,
          Key: path,
          Body: fileStream,
        }).promise(),
        repository.asset
          .create({
            _id: id,
            owner: id,
            path,
            url: `${cdn.userAssets}/${path}`,
            filename,
            type,
            size,
            mimetype,
          })])
        .then(([, asset]) => asset)
        .catch((error) => {
          throw new Error(error);
        });
    });
};
