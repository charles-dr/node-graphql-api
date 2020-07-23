const { date } = require('faker');
const { turn } = require('../model/LiveStreamExperienceModel');


function applyFilter(query, {
  searchQuery, categories, lang
}) {
  if (!query.$and) {
    query.$and = [
      { isDeleted: false },
    ];
  }

  if (searchQuery) {
    query.$and.push({
      $or: [
        { "slug": { $regex: `^.*${searchQuery}.*`, $options: 'i' } },
        { "translations.text": { $regex: `^.*${searchQuery}.*`, $options: 'i' } },
      ],
    });
  }

  if (categories) {
    query.$and.push({
      category: { $in: categories },
    });
  }

  if (lang) {
    query.$and.push({
      translations: {"$elemMatch": { lang }}
    });
  }
}

function transformSortInput({ feature, type }) {
  const availableFeatures = {
    CREATED_AT: 'createdAt',
    ALPHABET: 'slug',
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

class PhraseRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ _id: id, isDeleted: false });
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

  async getById(id) {
    return this.model.findOne({ _id: id, isDeleted: false });
  }

  async getBySlug(slug, category = null) {
    return this.model.findOne({ slug, isDeleted: false, category });
  }

  async getTotal(filter) {
    const query = {};
    applyFilter(query, filter);
    return this.model.countDocuments(query);
  }

  async add(data) {
    const phrase = new this.model(data);
    return phrase.save();
  }

  async deleteAll() {
    return this.model.deleteMany();
  }
}

module.exports = PhraseRepository;
