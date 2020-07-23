const path = require('path');

const repository = require(path.resolve('src/repository'));

module.exports = async (req, res) => {
  const { table } = req.params;
  try {
    const model = repository[table].model;
    return model.deleteMany({}).then(() => res.json({ status: true, message: 'success' }))
  } catch (e) {
    return res.json({
      status: false,
      message: e.message,
    });
  }
}
