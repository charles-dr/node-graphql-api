class StaticDataRepository {
  constructor(collectionModel) {
    this.collection = collectionModel;
  }

  getAll() {
    return this.collection.sort((a, b) => a.order - b.order);
  }

  getById(id) {
    return this.collection.filter((item) => item.id === id)[0] || null;
  }
}

module.exports = StaticDataRepository;
