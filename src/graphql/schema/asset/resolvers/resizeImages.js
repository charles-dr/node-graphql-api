const path = require('path');

const { AssetService } = require(path.resolve('src/lib/AssetService'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();


module.exports = async (_, { ids, width, height }, { dataSources: { repository }, user }) => {
  const result = {
    total: ids.length,
    success: 0,
    failed: 0,
    failedList: {
      ids: [],
      errors: [],
    },
  };
  return Promise.all(ids.map((assetId) => AssetService.resizeImage({
    assetId,
    width,
    height,
    updatePath: false, // overwrite the existing file.
  })
    .then((resized) => {
      result.success++;
    })
    .catch((error) => {
      result.failed++;
      result.failedList.ids.push(assetId);
      result.failedList.errors.push(error.message);
    })))
    .then(() => result)
    .catch((error) => {
      console.log('[error]', error);
      result.failedList.errors = [error.message];
      return result;
    });
};
