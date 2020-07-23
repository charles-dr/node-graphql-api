/* eslint-disable no-param-reassign */
function getSearchQueryByName(query) {
  return { name: { $regex: `${query}`, $options: 'i' } };
}

function filterWithHasProduct(query, hasProduct) {
  if (typeof hasProduct === 'boolean' && hasProduct) query.nProducts = { $gt: 0 };
  else if (typeof hasProduct === 'boolean' && !hasProduct) query.nProducts = { $eq: 0 };
}

function matchHashtag(category, tags) {
  if (!tags.length) return false;

  for (const hashtag of (category.hashtags || [])) {
    for (const tag of tags) {
      if (hashtag.includes(tag)) return true;
    }
  }
  return false;
}

function getAllUnderParent(allCategories, ids = [], tags) {
  if (ids.length === 0) return [];

  const categories = allCategories.filter((category) => ids.includes(category._id) || ids.includes(category.parent) || matchHashtag(category, tags));
  const newIds = categories.map((category) => category._id);
  const diff = newIds.filter((id) => !ids.includes(id));
  if (diff.length === 0) {
    return allCategories.filter((category) => newIds.includes(category._id));
  }
  return getAllUnderParent(allCategories, newIds, tags);
}

class ProductCategoryRepository {
  constructor(model) {
    this.model = model;
  }

  async getAll(query = {}) {
    return this.model.find(query).sort('level');
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getBySlug(slug) {
    return this.model.findOne({ slug });
  }

  async getByParent(id, hasProduct) {
    const query = { parent: id };
    filterWithHasProduct(query, hasProduct);
    return this.model.find(query).sort('order');
  }

  async getUnderParent(id) {
    return this.model.find({ parents: id }).sort('order');
  }

  async getUnderParents(ids, tags = []) {
    return this.getAll()
      .then((categories) => getAllUnderParent(categories, ids, tags));
  }

  async findByIds(ids) {
    return this.model.find({ _id: ids });
  }

  async searchByName(searchQuery, { skip, limit }, hasProduct) {
    const query = getSearchQueryByName(searchQuery);
    filterWithHasProduct(query, hasProduct);
    return this.model.find(
      query,
      null,
      { limit, skip, sort: { order: 1 } },
    );
  }

  async findByNames(names) {
    return this.model.findOne({ name: { $in: names } });
  }

  async load(query, { skip, limit }) {
    return this.model.find(
      query,
      null,
      { limit, skip, sort: { createdAt: 1 } },
    );
  }

  async getCountBySearch(query) {
    return this.model.countDocuments(getSearchQueryByName(query));
  }

  async getCountByParent(parent) {
    return this.model.countDocuments({ parent });
  }

  async reindex() {
    const categoryList = await this.model.find();
    const categoriesById = categoryList.reduce((res, cat) => ({ ...res, [cat.id]: cat }), {});
    const parentIds = categoryList.map((cat) => cat.parent).filter((id) => id);

    function fetchParentIds(entityId) {
      const parentId = categoriesById[entityId].parent;
      let parents = [entityId];
      if (parentId) {
        parents = parents.concat(fetchParentIds(parentId));
      }
      return parents;
    }

    const updatePromises = categoryList.map(async (cat) => {
      if (cat.parent) {
        cat.parents = fetchParentIds(cat.parent);
      }
      if (parentIds.includes(cat.id)) {
        cat.hasChildren = true;
      }

      return cat.save();
    });

    return Promise.all(updatePromises);
  }
}

module.exports = ProductCategoryRepository;
