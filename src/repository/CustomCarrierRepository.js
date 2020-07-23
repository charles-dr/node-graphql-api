const uuid = require('uuid/v4');

function getSearchQueryByName(query) {
  return { name: { $regex: `^${query}.*`, $options: 'i' } };
}

class CustomCarrierRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id }, (err, result) => {
      if (err) throw err;
      return result;
    });
  }

  async getAll(query = {}) {
    return this.model.find(query).sort({ name: 1 });
  }

  async loadList(ids) {
    return this.model.find({ _id: { $in: ids } });
  }

  async searchByName(query, { skip, limit }) {
    return this.model.find(
      getSearchQueryByName(query),
      null,
      {
        limit,
        skip,
      },
    );
  }

  async findByName(name) {
    return await this.model.findOne({ name });
  }

  async create(data) {
    const customCarrier = new this.model(data);
    return await customCarrier.save();
  }

  async getCountBySearch(query) {
    return this.model.countDocuments(getSearchQueryByName(query));
  }

  async findOrCreate(data) {
    const customCarrier = await this.findByName(data.name);

    if (customCarrier) {
      return customCarrier;
    }
    return await this.create({ _id: uuid(), name: data.name });
  }

  async addByName(data) {
    const card = new this.model({
      _id: uuid(),
      ...data,
    });
    return card.save();
  }
}

module.exports = CustomCarrierRepository;
