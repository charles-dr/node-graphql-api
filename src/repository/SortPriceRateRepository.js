const path = require('path');

class SortPriceRateRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ _id: id });
  }
}

module.exports = SortPriceRateRepository;
