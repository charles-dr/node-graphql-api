const uuid = require('uuid/v4');

class OrderItemRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getByIds(ids) {
    return this.model.find({ _id: ids });
  }

  async create(data) {
    const document = new this.model({
      _id: uuid(),
      ...data,
    });
    return document.save();
  }

  async changeStatus(ids, newStatus) {
    return this.model.updateMany(
      { _id: { $in: ids } },
      { status: newStatus },
      { multi: true },
    );
  }
  
  async getByProduct(id) {
    return this.model.find({ product: id });
  }
}

module.exports = OrderItemRepository;
