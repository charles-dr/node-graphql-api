class LiveStreamExperienceRepository {
  constructor(model) {
    this.model = model;
  }

  getAll(query = {}) {
    return this.model.find(query).sort('order');
  }

  getById(id) {
    return this.model.findOne({ _id: id });
  }
}

module.exports = LiveStreamExperienceRepository;