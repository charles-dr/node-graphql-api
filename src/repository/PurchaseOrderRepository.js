const uuid = require('uuid/v4');

function applyFilter(query, { buyer, statuses = [], isPaid, searchQuery, ids = [] }) {
  if (!query.$and) query.$and = [];
  
  if (buyer) query.$and.push({ buyer });

  if (statuses.length) query.$and.push({ status: {$in: statuses} });

  if (isPaid !== undefined && typeof isPaid === 'boolean') query.$and.push({ isPaid });

  if (searchQuery) query.$and.push({ _id: { $in: ids } });
}

function transformSortInput({ feature, type }) {
  const availableFeatures = {
    CREATED_AT: 'createdAt',
  };

  const availableTypes = {
    DESC: -1,
    ASC: 1,
  };

  if (typeof availableFeatures[feature] === 'undefined') {
    throw Error(`Sorting by "${feature}" feature is not provided.`);
  }

  if (typeof availableTypes[type] === 'undefined') {
    throw Error(`Sorting type "${feature}" is not provided.`);
  }

  return { [availableFeatures[feature]]: availableTypes[type] };
}

class PurchaseOrderRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getOne(query = {}) {
    return this.model.findOne(query);
  }

  async getAll() {
    return this.model.find();
  }

  async find({ user }) {
    return this.model.find({ buyer: user.id });
  }

  async delete(id) {
    return this.model.remove({ _id: id });
  }

  async getByBuyer(id) {
    return this.model.find({ buyer: id });
  }

  async findByTransactionId(id) {
    return this.model.findOne({ payments: id });
  }

  async create(data) {
    const document = new this.model({
      _id: uuid(),
      ...data,
    });
    return document.save();
  }

  async update(data) {
    const order = await this.getById(data.id);

    order.deliveryOrders = data.deliveryOrders ? data.deliveryOrders : order.deliveryOrders;
    order.items = data.items ? data.items : order.items;
    order.payments = data.payments ? data.payments : order.payments;
    order.isPaid = data.isPaid !==undefined ? data.isPaid : order.isPaid;
    order.currency = data.currency ? data.currency : order.currency;
    order.quantity = data.quantity ? data.quantity : order.quantity;
    order.price = data.price ? data.price : order.price;
    order.deliveryPrice = data.deliveryPrice ? data.deliveryPrice : order.deliveryPrice;
    order.total = data.total ? data.total : order.total;
    order.buyer = data.buyer ? data.buyer : order.buyer;
    order.paymentClientSecret = data.paymentClientSecret ? data.paymentClientSecret : order.paymentClientSecret;
    order.publishableKey = data.publishableKey ? data.publishableKey : order.publishableKey;
    order.error = data.error ? data.error : order.error;

    return order.save();
  }

  async getByClientSecret(id) {
    return this.model.findOne({ paymentClientSecret: id });
  }

  async addInovicePDF(id, url) {
    const purchaseOrder = await this.getById(id);
    purchaseOrder.invoicePDF = url;

    return purchaseOrder.save();
  }

  async addPackingSlip(id, url) {
    const purchaseOrder = await this.getById(id);
    purchaseOrder.packingSlips.push(url);

    return purchaseOrder.save();
  }

  async getInvoicePDF(id) {
    const purchaseOrder = await this.getById(id);

    if (!purchaseOrder) { return null; }

    return purchaseOrder.invoicePDF;
  }

  async addPaymentInfo(clientSecret, paymentInfo) {
    const purchaseOrder = await this.getByClientSecret(clientSecret);
    purchaseOrder.paymentInfo = paymentInfo;

    return purchaseOrder.save();
  }

  async updateStatusByClientSecret(clientSecret, status) {
    const purchaseOrder = await this.getByClientSecret(clientSecret);
    purchaseOrder.status = status;

    return purchaseOrder.save();
  }

  async get(filter, sort, page) {
    const query = {};
    applyFilter(query, filter);
    return this.model.find(query, null, { 
      sort: transformSortInput(sort),
      ...page,
    });
  }

  async getTotal(filter) {
    const query = {};
    applyFilter(query, filter);
    return this.model.countDocuments(query);
  }

  async getByOrderItem(id) {
    return this.model.findOne({ items: id });
  }
}

module.exports = PurchaseOrderRepository;
