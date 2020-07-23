const path = require('path');

const { assets: { types } } = require(path.resolve('config'));

class MIMEAssetTypes {
  constructor(map) {
    this.map = map;
  }

  detect(type) {
    return this.map.filter((item) => item.mime === type.toLowerCase())[0] || null;
  }
}

const MIMEMap = [
  { mime: 'image/gif', ext: 'gif', type: types.IMAGE },
  { mime: 'image/jpeg', ext: 'jpg', type: types.IMAGE },
  { mime: 'image/png', ext: 'png', type: types.IMAGE },
  { mime: 'image/svg+xml', ext: 'svg', type: types.IMAGE },

  { mime: 'video/mp4', ext: 'mp4', type: types.VIDEO },

  { mime: 'application/pdf', ext: 'pdf', type: types.PDF },

  { mime: 'application/vnd.ms-excel', ext: 'csv', type: types.CSV },
];

module.exports = new MIMEAssetTypes(MIMEMap);
