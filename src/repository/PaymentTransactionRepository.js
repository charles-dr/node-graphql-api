class PaymentTransactionRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getByIds(ids) {
    return this.model.find({ _id: ids });
  }

  async getByProviderTransactionId(id) {
    return this.model.findOne({ providerTransactionId: id });
  }

  async create(data) {
    const document = new this.model(data);
    return document.save();
  }
}

module.exports = PaymentTransactionRepository;
