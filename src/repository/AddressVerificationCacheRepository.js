/* eslint-disable no-param-reassign */

class AddressVerificationCacheRepository {
  constructor(model) {
    this.model = model;
  }

  async get(data) {
    return this.model.findOne({
      'address.street': data.street,
      'address.city': data.city,
      'address.region': data.region,
      'address.country': data.country,
      'address.zipCode': data.zipCode,
    });
  }

  async create(data) {
    const addressCache = new this.model(data);
    return addressCache.save();
  }
}

module.exports = AddressVerificationCacheRepository;
