/* eslint-disable no-param-reassign */
const uuid = require('uuid/v4');

class OrganizationRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ _id: id });
  }

  async create(data) {
    if (!data.owner) {
      throw Error('Owner is required!');
    }

    const organization = new this.model({
      ...data,
      _id: uuid(),
    });

    return organization.save();
  }

  async findOrCreate(data) {
    if (!data.owner) {
      throw Error('Owner is required!');
    }

    const organization = await this.getByUser(data.owner);

    if (organization) {
      return organization;
    } else {
      const organization = new this.model({
        ...data,
        _id: uuid(),
      });
  
      return organization.save();
    }
  }

  async update(organization, data) {

    if (!organization) {
      return this.create(data);
    }

    if (data.address) {
      organization.billingAddress = data.billingAddress || organization.billingAddress;
      organization.address = data.address || organization.address;
    }

    if (data.carriers || data.customCarrier) {
      organization.carriers = data.carriers === null || data.carriers ? data.carriers : organization.carriers;
      organization.customCarrier = data.customCarrier === null || data.customCarrier ? data.customCarrier : organization.customCarrier;
      organization.workInMarketTypes = data.workInMarketTypes || organization.workInMarketTypes;
    }
    organization.payoutInfo = data.payoutInfo || organization.payoutInfo;
    organization.returnPolicy = data.returnPolicy || organization.returnPolicy;

    return organization.save();
  }

  async getAll(query = {}) {
    return this.model.find(query);
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getByOwner(user) {
    return this.model.findOne({ owner: user });
  }

  async getByUser(id) {
    return this.model.findOne({ owner: id });
  }
}

module.exports = OrganizationRepository;
