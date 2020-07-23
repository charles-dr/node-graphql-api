const uuid = require('uuid/v4');

function getSearchQueryByName(query) {
  return query ? { name: { $regex: `${query}`, $options: 'i' } } : {};
}

function applyFilter(query, {
  searchQuery, hasProduct, hasImage, categoryId,
}) {
  console.log('searchQuery1', searchQuery, hasProduct, hasImage);
  if (!query.$and) query.$and = [{ name: { $exists: true } }];
  if (searchQuery != undefined && searchQuery != '') query.$and.push({ name: { $regex: `${searchQuery}`, $options: 'i' } });
  if (hasProduct != undefined) query.$and.push({ nProducts: { $gt: 0 } });
  if (hasImage != undefined) query.$and.push({ 'images.0': { $exists: true } });
  if (categoryId != undefined) query.$and.push({ brandCategories: categoryId });
}

class BrandRepository {
  constructor(model) {
    this.model = model;
  }

  async getAll(query = {}) {
    return this.model.find(query).sort({ name: 1 });
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getByIds(ids) {
    return this.model.findOne({ _id: ids });
  }

  async getBySlug(slug) {
    return this.model.findOne({ slug });
  }

  async get({ filter, page }) {
    const query = {};
    applyFilter(query, filter);
    // if page.limit is not set, get all without limit.
    const pager = {};
    if (page && page.limit) {
      pager.limit = page.limit;
      pager.skip = page.skip || 0;
    }
    console.log('query', JSON.stringify(query));
    return this.model.find(
      query,
      null,
      {
        ...pager,
        sort: { order: 1 },
      },
    );
  }

  async getTotal(filter) {
    const query = {};
    applyFilter(query, filter);
    return this.model.countDocuments(query);
  }

  async searchByName(query, { skip, limit }) {
    return this.model.find(
      getSearchQueryByName(query),
      null,
      {
        limit,
        skip,
      },
    );
  }

  async findByName(name) {
    return await this.model.findOne({ name });
  }

  async findByNames(names) {
    return await this.model.findOne({ name: { $in: names } });
  }

  async create(data) {
    const brand = new this.model(data);
    return brand.save();
  }

  async getCountBySearch(query) {
    return this.model.countDocuments(getSearchQueryByName(query));
  }

  async findOrCreate(data) {
    const brand = await this.findByName(data.name);

    if (brand) {
      return brand;
    }
    return await this.create({ _id: uuid(), name: data.name });
  }

  async getByCategoryAndTags(categoryIds = [], tags = []) {
    const query = {};
    const $or = [];
    if (Array.isArray(categoryIds) && categoryIds.length) {
      const $orCategory = [];
      categoryIds.forEach((categoryId) => {
        $orCategory.push({ brandCategories: categoryId });
      });
      $or.push({ $or: $orCategory });
    }

    if (Array.isArray(tags) && tags.length) {
      const $orTags = [];
      tags.forEach((tag) => {
        $orTags.push({ hashtags: { $regex: `${tag}`, $options: 'i' } });
      });
      $or.push({ $or: $orTags });
    }
    if ($or.length) query.$or = $or;
    return this.model.find(query);
  }
}

module.exports = BrandRepository;
