const uuid = require('uuid/v4');

class StreamSourceRepository {
  constructor(model) {
    this.model = model;
  }

  async getByID(id) {
    return this.model.findOne({ _id: id });
  }

  async getByLanguage(lang) {
    return this.model.find({language: lang});
  }

  async getAll(query = {}) {
    return this.model.find(query);
  }
}

module.exports = StreamSourceRepository;
