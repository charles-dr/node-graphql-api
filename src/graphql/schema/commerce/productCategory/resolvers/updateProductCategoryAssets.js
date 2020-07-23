const path = require('path');
const promise = require('bluebird');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const { aws } = require(path.resolve('config'));

module.exports = async (_, { fileName }, { dataSources: { repository }, user }) => {
  const params = {
    Bucket: aws.user_bucket,
    Key: fileName
  };

  const csv = await new Promise((resolve, reject) => {
    s3.getObject(params, async (err, data) => {
      const dataRes = await data.Body.toString("UTF-8").split('\n');
      if (err)
        reject(err);

      resolve(dataRes);
    });
  });

  let [header, ...rows] = csv;
  header = header.trim().split(',');

  let assetsMapping = {}
  let index = 0;
  for (const row of rows) {
    index++;
    if (row !== "") {
      const columns = row.split(',');
      let categoryAssets = {};

      await columns.forEach((column, colIndex) => {
        if (column !== undefined) {
          categoryAssets[header[colIndex]] = column.trim();
        }
      });
      categoryAssets.owner = user.id;
      categoryAssets.row = index;

      await repository.asset.createFromCSVForCategories(categoryAssets).then(res => {
        assetsMapping[categoryAssets.path] = res.id;
        return res.id;
      }).catch(err => {
        console.log(`Assets failed to save. row: ${categoryAssets.row}`, err);
      });
    }
  }

  return Object.values(assetsMapping).map(assetId => {
    return repository.asset.getById(assetId);
  });
};