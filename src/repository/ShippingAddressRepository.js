const uuid = require('uuid/v4');
const path = require('path');

class ShippingAddressRepository {
  constructor(model) {
    this.model = model;
  }

  async findOne(id, includeDeleted = false) {
    const query = { _id: id };
    if (!includeDeleted) {
      query.isDeleted = false;
    }
    return this.model.findOne(query);
  }

  async create(data) {
    const isDefaultItem = await this.model.find({ owner: data.owner, isDefault: true });
    if (isDefaultItem.length > 0) {
      data.isDefault = false;
    } else {
      data.isDefault = true;
    }
    console.log('shippingaddress create:', data, isDefaultItem, data.isDefualt);
    const shippingAddress = new this.model({
      _id: uuid(),
      ...data,
    });
    return shippingAddress.save();
  }

  async findByOwnerAndSize(data) {
    return this.model.findOne(data);
  }

  async remove(id) {
    await this.model.update({ _id: id }, { isDeleted: true });
    return true;
  }

  async getAll(query) {
    const q1 = { ...query, isDeleted: false };
    console.log('q1', q1);
    const result = await this.model.find(q1);
    console.log('result', result);
    return result;
  }
}

module.exports = ShippingAddressRepository;
