const path = require('path');
const LiveStreamModel = require(path.resolve('src/model/LiveStreamModel'));

module.exports = async (req, res) => {
  return LiveStreamModel.updateMany(
    {},
    { translated: 0 },
    { multi: true },
  )
    .then((updated) => res.json(updated));
}
