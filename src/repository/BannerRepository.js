const path = require('path');
const uuid = require('uuid/v4');

function transformSortInput({ feature, type }) {
  const availableFeatures = {
    CREATED_AT: 'createdAt',
    SIZE: 'size',
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

function applyFilter(query, { searchQuery, sitePath, type, adType, layout, identifiers = [] }) {
  if (!query.$and) {
    query.$and = [
      { name: {$ne: null} }
    ];
  }

  if (searchQuery) {
    query.$and.push({ name: {$regex: `^${searchQuery}.*`, $options: 'i' } });
  }

  if (sitePath) query.$and.push({ sitePath });
  if (type) query.$and.push({ type });
  if (adType) query.$and.push({ adType });
  if (layout) query.$and.push({ layout });
  if (identifiers.length) query.$and.push({ identifier: { $in: identifiers } });
}

class BannerRepository {

  constructor(model) {
    this.model = model;
  }

  async create(data) {
    const banner = new this.model(data);
    return banner.save();
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getOne(query = {}) {
    return this.model.findOne(query);
  }

  async getByIds(ids) {
    return this.model.find({ _id: ids });
  }

  async getByPath(path) {
    return await this.model.findOne({ path: path });
  }

  async getByName(name) {
    return this.model.findOne({ name });
  }

  async getCsvAssetByStatus(status, userid) {
    return await this.model.find({ status: status, owner: userid, type: "CSV" });
  }

  async getAll(query = {}) {
    return this.model.find(query);
  }

  async get(filter, sort, page) {
    const pager = {};
    if (page.limit) {
      pager.limit = page.limit;
      pager.skip = page.skip || 0;
    }

    let query = {};
    applyFilter(query, filter);

    return this.model.find(
      query,
      null,
      {
        sort: transformSortInput(sort),
        ...pager,
      }
    )
  }

  async getTotal(filter) {
    let query = {};
    applyFilter(query, filter);
    return this.model.countDocuments(query);
  }

  async deleteBanner(data) {
    return this.model.findAndRemove({ _id: data.id })
  }

  async deleteById(id) {
    return this.model.findAndRemove({ _id: id });
  }
}

module.exports = BannerRepository;