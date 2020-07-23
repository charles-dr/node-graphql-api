/* eslint-disable no-param-reassign */
const uuid = require('uuid/v4');

class DeliveryLabelRepository {
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
    const label = new this.model({
      _id: uuid(),
      ...data,
    });
    return label.save();
  }
}

module.exports = DeliveryLabelRepository;
