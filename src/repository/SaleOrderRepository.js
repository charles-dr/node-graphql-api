const uuid = require('uuid/v4');

function applyFilter(query, { statuses, purchaseOrder }, user) {
  if (!query.$and && (statuses || purchaseOrder || user)) {
    query.$and = [];
  }

  if (user) {
    query.$and.push({
      seller: user.id,
    });
  }

  if (statuses && statuses.length > 0) {
    query.$and.push({
      $or: statuses.map((item) => ({ status: item })),
    });
  }

  if (purchaseOrder) {
    query.$and.push({
      purchaseOrder,
    });
  }
}

class SaleOrderRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getAll(query = {}) {
    return this.model.find(query);
  }

  async find({ user }) {
    return this.model.find({ seller: user.id });
  }

  async delete(id) {
    return this.model.remove({ _id: id });
  }


  async create(data) {
    const document = new this.model({
      _id: uuid(),
      ...data,
    });
    return document.save();
  }

  async get({ filter, page, user }) {
    const query = {};
    applyFilter(query, filter, user);
    return this.model.find(
      query,
      null,
      {
        limit: page.limit,
        skip: page.skip,
      },
    );
  }

  async getTotal(filter, user) {
    const query = {};
    applyFilter(query, filter, user);
    return this.model.countDocuments(query);
  }

  async updateStatus(status, id) {
    const order = await this.getById(id);
    order.status = status;
    return order.save();
  }

  async addPackingSlip(id, url) {
    // const saleOrder = await this.getById(id);
    // saleOrder.packingslip = url;
    // return saleOrder.save();
    return this.model.findOneAndUpdate({ _id: id }, { packingslip: url }, { new: true });
  }

  async getPackingSlip(id) {
    const saleOrder = await this.getById(id);
    if (!saleOrder) { return null; }

    return saleOrder.packingslip;
  }
}

module.exports = SaleOrderRepository;
