
class RegionRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getAll(query) {
    return this.model.find(query).sort({ name: 1 });
  }

  async loadList(ids) {
    return this.model.find({ _id: { $in: ids } });
  }
}

module.exports = RegionRepository;
