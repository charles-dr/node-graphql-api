const path = require('path');
const uuid = require("uuid/v4");
const { ThemeType } = require(path.resolve('src/lib/Enums'));

const applyFilter = (query, {  }) => {
  if (!query.$and) {
    query.$and = [{ name: {$ne: null} }];
  }
}

function transformSortInput({ feature, type }) {
  const availableFeatures = {
    CREATED_AT: 'createdAt',
    NAME: 'name',
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
class IssueCategoryRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    if (!data._id) data = { ...data, _id: uuid() };
    const issueCategory = new this.model(data);

    return issueCategory.save();
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getByIds(ids) {
    return this.model.find({ _id: { $in: ids } });
  }

  async getByName(name) {
    return this.model.findOne({ name });
  }

  async getAll(query = {}) {
    return this.model.find(query);
  }

  async deleteById(itemId) {
    if (typeof itemId !== 'string') {
      throw new Error(`IssueCategory.delete expected id as String, but got "${typeof itemId}"`);
    }

    return this.model.deleteOne({ _id: itemId });
  }

  async get({ filter, sort, page }) {
    const query = {};
    applyFilter(query, filter);
    return this.model.find(
      query,
      null,
      {
        sort: transformSortInput(sort),
        limit: page.limit,
        skip: page.skip,
      },
    );
  }

  async getTotal(filter) {
    const query = {};
    applyFilter(query, filter);
    return this.model.countDocuments(query);
  }
}

module.exports = IssueCategoryRepository;
