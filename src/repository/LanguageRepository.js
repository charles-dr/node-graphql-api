
class LanguageRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getAll() {
    return this.model.find().sort({ name: 1 });
  }

  async loadList(ids) {
    return this.model.find({ _id: { $in: ids } });
  }

  async deleteAll() {
    return this.model.deleteMany();
  }

  async create(data) {
    const language = new this.model(data);
    return language.save();
  }
}

module.exports = LanguageRepository;
