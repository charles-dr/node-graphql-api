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

function applyFilter(query, { tag, type, target, user, order, lang }) {
  if (!query.$and) {
    query.$and = [{ tag: {$exists: true} }];
  }

  if (tag) query.$and.push({ tag });

  if (type) query.$and.push({ tag: { $regex: `${type}:`, $options: 'i' } });

  if (target) query.$and.push({ tag: { $regex: `:${target}`, $options: 'i' } });

  if (user) query.$and.push({ user });

  if (order) query.$and.push({ order });

  if (lang) query.$and.push({ lang });
}

class RatingRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async load(tag, userId) {
    return this.model.findOne({ tag, user: userId });
  }

  async create(data) {
    let insertItem = data;
    let checkReview = await this.model.findOne({
      tag: insertItem.tag,
      user: insertItem.user,
    });
    if (checkReview !== null) {
      checkReview = Object.assign(checkReview, insertItem);
      checkReview.save()
      return checkReview;
    }
    if (!insertItem._id) insertItem = { ...data, _id: uuid() };
    const review = new this.model(insertItem);
    await review.save();
    console.log("insertItem",insertItem)
    review.id=review._id
    return review;
  }
  
  async getByProduct(id, userId) {
    return this.model.findOne({
      tag: `Product:${id}`,
      user: userId,
    });
  }

  async getAverage(tag) {
    return this.model.aggregate([
      {
        $match: { tag },
      },
      {
        $group:
          {
            _id: '$tag',
            value: { $avg: '$rating' },
          },
      },
    ]).then((rating) => (rating.length > 0 ? rating[0].value : 0));
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

module.exports = RatingRepository;
