const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const AWS = require('aws-sdk');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { aws, cdn } = require(path.resolve('config'));

const errorHandler = new ErrorHandler();

const s3 = new AWS.S3();

module.exports = async (root, { file }, { user, dataSources: { repository } }) => {
  const { createReadStream, mimetype, filename } = await file;
  const fileStream = createReadStream();
  const size = 100;
  const validator = new Validator({ mimetype, size }, {
    mimetype: 'required',
    size: 'required',
  });

  return validator.check()
    .then((matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
      const ext = 'csv';
      const type = 'CSV';
      const id = uuid();
      const path = `${user.id}/${id}.${ext}`;

      return Promise.all([
        s3.upload({
          Bucket: aws.user_bucket,
          Key: path,
          Body: fileStream,
        }).promise(),
        repository.asset
          .create({
            _id: id,
            owner: user,
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
