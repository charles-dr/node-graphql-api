const path = require("path");
const fs = require("fs");
const os = require("os");
const request = require("request");
const sizeOf = require("image-size");
const resizeImg = require("resize-img");
const uuid = require('uuid/v4');

const repository = require(path.resolve("src/repository"));

const AWS = require("aws-sdk");

const { aws, cdn } = require(path.resolve("config"));
const s3 = new AWS.S3();

const removeFile = async (path) => {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (err) => {
      if (err) reject(err);
      resolve(true);
    });
  });
};

const assetTokenFromPath = (path) => {
  const tempArr = path.split('/');
  return tempArr[tempArr.length - 1].split('.')[0];
}

const detectBudgetFromURL = (url) => {
  if (url.includes(cdn.aliexpress)) return aws.aliexpress_scrapped;
  else if (url.includes(cdn.vendorBuckets)) return aws.vendor_bucket;
  else if (url.includes(cdn.userAssets)) return aws.user_bucket;
  else if (url.includes(cdn.media)) return aws.media_bucket;
  else if (url.includes(cdn.appAssets)) return aws.app_bucket;
  else {
    return aws.upload_bucket;
  }
}

module.exports.AssetService = {
  async resizeImage({ assetId, width, height = null }) {
    let _asset, _localPath;
    return repository.asset
      .getById(assetId)
      .then((asset) => {
        if (!asset) {
          throw Object.assign(new Error(`Asset with id "${assetId}" does not exist!`), { code: 400 } );
        }
        _asset = asset;
        return this.downloadImgToLocal(asset.url);
      })
      .then((localPath) => {
        _localPath = localPath;
        return this.getImageResolution(localPath);
      })
      .then(async (dimensions) => {
        if (dimensions.width > width) {
          height = Math.floor((dimensions.height * width) / dimensions.width);
          const image = await resizeImg(fs.readFileSync(_localPath), {
            width,
            height,
          });
          fs.writeFileSync(_localPath, image);
          // const assetToken = assetTokenFromPath(_asset.path);
          // const newToken = assetToken; //uuid();
          // _asset.path = _asset.path.toString().replace(assetToken, newToken);
          // _asset.url = _asset.url.toString().replace(assetToken, newToken);
          _asset.resolution = { width, height };
          // const strPath = _asset.path; 
          const bucket = detectBudgetFromURL(_asset.url); console.log('[Bucket]', bucket);
          return Promise.all([
            s3
              .putObject({
                Bucket: bucket, //aws.user_bucket,
                Key: _asset.path,
                Body: fs.createReadStream(_localPath),
                // CacheControl: "no-cache",
                // Expires: new Date(Date.now() - 86400000), //new Date(),
                // ACL: 'public-read',
              })
              .promise(),
            _asset.save(),
          ]);
        } else {
          _asset.resolution = { width: dimensions.width, height: dimensions.height };
          return Promise.all([
            null,
            _asset.save(),
          ]);
        }
      })
      .then(([, asset]) => {
        return removeFile(_localPath);
      })
      .then(() => true)
      .catch((error) => {
        console.log(error);
        return false;
      });
  },

  async downloadImgToLocal(url) {
    console.log("[downloading]", url);
    return new Promise((resolve, reject) => {
      request(url)
        .pipe(
          fs.createWriteStream(path.join(os.tmpdir(), url.split("/").pop()))
        )
        .on("close", () => {
          resolve(path.join(os.tmpdir(), url.split("/").pop()));
        })
        .on("error", () => {
          reject(false);
        });
    });
  },

  async getImageResolution(path) {
    return new Promise((resolve, reject) => {
      sizeOf(path, (err, dimentions) => {
        err ? reject(err) : resolve(dimentions);
      });
    });
  },
};
