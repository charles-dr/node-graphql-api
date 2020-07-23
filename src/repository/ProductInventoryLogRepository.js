const { date } = require('faker');
const { turn } = require('../model/LiveStreamExperienceModel');

class ProductRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ _id: id });
  }

  async add(data) {
    const inventory = new this.model(data);
    return inventory.save();
  }

  async update(id, quantity) {
    const inventory = await this.load(id);
    inventory.shift = quantity;
    return inventory.save();
  }

  async getOne(query = {}) {
    return this.model.findOne(query);
  }

  async getByProductId(id) {
    return this.model.findOne({ product: id });
  }

  async getQuantityByProductId(id) {
    return this.model.aggregate([
      { $match: { product: id } },
      {
        $group: {
          _id: null,
          quantity: { $sum: '$shift' },
        },
      },
    ])
      .then(([{ quantity }]) => quantity)
      .catch(err => {
        return 0
      });
  }

  async decreaseQuantity(id, quantity) {
    try {
      const inventory = await this.getByProductId(id);
      return this.update(inventory.id, inventory.shift - quantity);
    } catch (err) {
      throw new Error(err);
    }
  }

  async checkAmount(id, quantity) {
    try {
      const inventory = await this.getByProductId(id);
      if (inventory.shift - quantity < 1) return false;
      return true;
    } catch (err) {
      throw new Error(err);
    }
  }

  async getByProductIdAndAttrId(productId, productAttrId) {
    return this.model.findOne({ product: productId, productAttribute: productAttrId });
  }

  async checkAmountByAttr(productId, productAttrId, quantity) {
    try {
      const inventory = await this.getByProductIdAndAttrId(productId, productAttrId);
      if (inventory.shift - quantity < 1) return false;
      return true;
    } catch (err) {
      throw new Error(err);
    }
  }

  async deleteAll(query = {}) {
    return this.model.deleteMany(query);
  }
}

module.exports = ProductRepository;
