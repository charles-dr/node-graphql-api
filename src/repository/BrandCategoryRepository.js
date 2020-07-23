/* eslint-disable no-param-reassign */
function getSearchQueryByName({ query: keyword, isRecommended = null }) {
  const query = {};
  const $and = [];
  if (keyword) {
    $and.push({ name: { $regex: `^${keyword}.*`, $options: 'i' } });
  }
  if (typeof isRecommended === 'boolean') {
    $and.push({ isRecommended: isRecommended });
  }
  if ($and.length) {
    query.$and = $and;
  }
  return query;
}

class BrandCategoryRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    const brandCategory = new this.model(data);
    return brandCategory.save();
  }

  async getAll() {
    return this.model.find();
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async findByIds(ids) {
    return this.model.find({ _id: ids });
  }

  async search(filter, { skip, limit }) {
    return this.model.find(
      getSearchQueryByName(filter),
      null,
      { limit, skip, sort: { order: 1 } },
    );
  }

  async getCountBySearch(filter) {
    return this.model.countDocuments(getSearchQueryByName(filter));
  }

  async getByIdsAndTags(ids = [], tags = []) {
    const query = {};
    const $or = [];
    if (Array.isArray(ids) && ids.length) {
      $or.push({ _id: { $in: ids } });
    }

    if (Array.isArray(tags) && tags.length) {
      const $orTags = [];
      tags.forEach(tag => {
        $orTags.push({ hashtags: { $regex: `${tag}`, $options: 'i' } });
      });
      $or.push({$or: $orTags});
    }
    if ($or.length) query.$or = $or;
    return this.model.find(query);
  }
}

module.exports = BrandCategoryRepository;
