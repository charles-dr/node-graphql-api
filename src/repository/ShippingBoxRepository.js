const uuid = require('uuid/v4');
const path = require('path');
const { providers: { EasyPost } } = require(path.resolve('src/bundles/delivery'));

class ShippingBoxRepository {

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
    const shippingBox = new this.model({
      _id: uuid(),
      ...data,
    });
    return shippingBox.save();
  }

  async findByOwnerAndSize(data) {
    return this.model.findOne(data);
  }

  async findOrAdd(data) {
    const boxExist = await this.findByOwnerAndSize(data);
    if (boxExist) {
      return boxExist;
    } else {
      const parcelId = await EasyPost.addParcel(data).then(shippingBox => {
        return shippingBox.id;
      });
      data = { parcelId: parcelId, ...data }
      return this.create(data);
    }
  }

  async findByLabelAndOwner(data) {
    return this.model.findOne({ label: data.label || 'null', owner: data.owner });
  }

  async remove(id) {
    return this.model.update({ _id: id }, { isDeleted: true });
  }

  async getAll(query) {
    return this.model.find({ ...query, isDeleted: false });
  }
}

module.exports = ShippingBoxRepository;