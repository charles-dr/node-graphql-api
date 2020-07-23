const path = require('path');
const LiveStreamModel = require(path.resolve('src/model/LiveStreamModel'));

module.exports = async (req, res) => {
  return LiveStreamModel.updateMany({}, { translated: 0 })
    .then(() => res.json({ status: true }))
    .catch(error => res.json({ status: false, message: error.message }));
}
