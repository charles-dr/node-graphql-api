const uuid = require('uuid/v4');

class DeliveryOrderRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getByIds(ids) {
    // console.log({ ids });
    const deliveryOrders = await this.model.find({ _id: { $in: ids } });
    // console.log('deliveryOrders=====>', deliveryOrders);
    return deliveryOrders;
  }

  async getAll() {
    return this.model.find();
  }

  async find({ user }) {
    return this.model.find({ seller: user.id });
  }

  async findByOrderItem(id) {
    return this.model.findOne({ item: id });
  }

  async findByTrackingNumber(trackingNumber) {
    return this.model.findOne({ trackingNumber });
  }

  async create(data) {
    const document = new this.model({
      _id: uuid(),
      ...data,
    });
    return document.save();
  }

  async updateTrackingNumber(id) {
    const order = await this.getById(id);
    order.trackingNumber = uuid();
    return order.save();
  }
}

module.exports = DeliveryOrderRepository;
