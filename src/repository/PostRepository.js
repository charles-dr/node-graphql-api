const uuid = require("uuid/v4");

function transformSortInput({ feature, type }) {
  const availableFeatures = {
    CREATED_AT: 'createdAt',
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

function applyFilter(query, { searchQuery, author, hasLiveStream }) {
  if (!query.$and) {
    query.$and = [{ deleted: false }];
  }

  if (searchQuery) {
    query.$and.push({$or: [
      { title: { $regex: `^.*${searchQuery}.*`, $options: 'i' }},
      { feed: { $regex: `^.*${searchQuery}.*`, $options: 'i' }},
    ]});
  }

  if (author) query.$and.push({ tags: author });

  if (hasLiveStream) query.$and.push({ "streams.0": { $exists: true } });
}

class PostRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    if (!data._id) data = { ...data, _id: uuid() };
    const post = new this.model(data);
    return post.save();
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async get(filter, sort, page) {
    const query = {};
    applyFilter(query, filter);
    
    return this.model.find(query, null, { 
      sort: transformSortInput(sort),
      ...page,
    });
  }

  async getTotal(filter) {
    const query = {};
    applyFilter(query, filter);
    return this.model.countDocuments(query);
  }

  async delete(id) {
    return this.model.deleteOne({ _id: id });
  }
}

module.exports = PostRepository;
