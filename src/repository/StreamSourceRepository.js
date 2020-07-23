const uuid = require('uuid/v4');

class StreamSourceRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ _id: id });
  }

  async getByIds(ids) {
    return this.model.find({ _id: ids });
  }

  async create(data) {
    const source = new this.model({
      ...data,
      _id: uuid(),
    });

    return source.save();
  }

  async getAll(query = {}) {
    return this.model.find(
      query,
      null,
      {
        sort: { createdAt: 1 },
      },
    );
  }
}

module.exports = StreamSourceRepository;
