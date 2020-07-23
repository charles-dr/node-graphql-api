const uuid = require("uuid/v4");

class VocabularyRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    if (!data._id) data = { ...data, _id: uuid() };
    const vocab = new this.model(data);
    return vocab.save();
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getAll(query = {}) {
    return this.model.find(query);
  }
  
  async deleteAll(query = {}) {
    return this.model.deleteMany(query);
  }
}

module.exports = VocabularyRepository;
