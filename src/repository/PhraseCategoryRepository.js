/* eslint-disable no-param-reassign */
function getSearchQueryByName(query) {
  return { name: { $regex: `^${query}.*`, $options: 'i' } };
}

class PhraseCategoryRepository {
  constructor(model) {
    this.model = model;
  }

  async add(data) {
    const phraseCategory = new this.model(data);
    return phraseCategory.save();
  }

  async allUnderParent(parentId) {
    return parentId ? this.model.find({ parents: parentId }) : this.model.find();
  }

  async getAll() {
    return this.model.find();
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getByParent(id) {
    return this.model.find({ parent: id }).sort('order');
  }

  async findByIds(ids) {
    return this.model.find({ _id: ids });
  }

  async findByName(name) {
    return this.model.findOne({ name });
  }

  async checkDuplicate(name, parent) {
    return this.model.findOne({name, parent});
  }

  async searchByName(query, { skip, limit }) {
    return this.model.find(
      getSearchQueryByName(query),
      null,
      { limit, skip, sort: { order: 1 } },
    );
  }

  async getCountBySearch(query) {
    return this.model.countDocuments(getSearchQueryByName(query));
  }

  async getCountByParent(parent) {
    return this.model.countDocuments({ parent });
  }

  async fetchParents(entityId) {
    const categoryList = await this.model.find();
    const categoriesById = categoryList.reduce((res, cat) => ({ ...res, [cat.id]: cat }), {});
    function fetchParentIds(entityId) {
      let parents = [entityId];
      try {
        const parentId = categoriesById[entityId].parent;
        if (parentId) {
          parents = parents.concat(fetchParentIds(parentId));
        }
      } catch (e) {}
      return parents;
    }
    return fetchParentIds(entityId);
  }

  async deleteAll() {
    return this.model.deleteMany();
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

module.exports = PhraseCategoryRepository;
