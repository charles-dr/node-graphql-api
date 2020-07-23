const { StreamChannelStatus } = require('../lib/Enums');
const publicStatuses = [ StreamChannelStatus.STREAMING, StreamChannelStatus.FINISHED, StreamChannelStatus.PENDING ];

function transformSortInput({ feature, type }) {
  const availableFeatures = {
    CREATED_AT: "createdAt",
  };

  const availableTypes = {
    DESC: -1,
    ASC: 1,
  };

  if (typeof availableFeatures[feature] === "undefined") {
    throw Error(`Sorting by "${feature}" feature is not provided.`);
  }

  if (typeof availableTypes[type] === "undefined") {
    throw Error(`Sorting type "${feature}" is not provided.`);
  }

  return { [availableFeatures[feature]]: availableTypes[type] };
}

function elasticFilter(filter) {
  const emptyQuery = {};
  const query = {
    $and: [],
  };
  if (filter) {
    query.$and.push({
      $or: [
        { title: { $regex: `^.*${filter}.*`, $options: 'i' } },
        { city: { $regex: `^.*${filter}.*`, $options: 'i' } },
      ],
    });
  }
  query.$and.push({
    status: { $ne: 'CANCELED' },
  });
  return query.$and.length > 0 ? query : emptyQuery;
}

function transformFilter({
  searchQuery,
  experiences = [],
  categories = [],
  cities = [],
  statuses = [],
  streamers = [],
  blackList,
  // product,
  isFeatured = null,
  products = null,
  videoTags = [],
}) {
  const emptyQuery = {};
  const query = {
    $and: [],
  };

  if (searchQuery) {
    const pieces = searchQuery.split(' ');
    const $or = pieces.map((piece) => ({ hashtags: { $regex: `${piece}`, $options: 'i' } }));
    $or.push({ title: { $regex: `^.*${searchQuery}.*`, $options: 'i' }})
    $or = $or.concat(pieces.map(piece => ({ videoTags: piece })));
    query.$and.push({ $or });
  }

  if (videoTags.length > 0) {
    const $and = videoTags.map(tag => ({ videoTags: tag }));
    query.$and.push({ $and });
  }

  if (experiences.length > 0) {
    query.$and.push({
      experience: { $in: experiences },
    });
  }

  if (categories.length > 0) {
    query.$and.push({
      categories: { $in: categories },
    });
  }

  if (cities.length > 0) {
    query.$and.push({
      city: { $in: cities },
    });
  }

  if (statuses.length > 0) {
    query.$and.push({
      status: { $in: statuses },
    });
  }

  if (streamers.length > 0) {
    query.$and.push({
      streamer: { $in: streamers },
    });
  }

  if (products) { // && products.length
    products.push("1"); // default id in case of length 0.
    query.$and.push({ $or: products.map(product => ({ "productDurations.product": product })) });
  }

  if (blackList && blackList.length > 0) {
    query.$and.push({
      streamer: { $nin: blackList },
    });
  }

  if (isFeatured !== null) {
    query.$and.push({ isFeatured });
  }


  return query.$and.length > 0 ? query : emptyQuery;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
}

class LiveStreamRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ _id: id });
  }

  async create(data) {
    const liveStream = new this.model(data);

    return liveStream.save();
  }

  async toggleLike(id, count) {
    const liveStream = await this.load(id);
    if (!liveStream) {
      throw Error(`Live Stream "${id}" does not exist!`);
    }
    liveStream.realLikes += count;
    return liveStream.save();
  }

  async update(id, data, flag) {
    const liveStream = await this.load(id);
    if (!liveStream) {
      throw Error(`Live Stream "${id}" does not exist!`);
    }

    liveStream.title = data.title || liveStream.title;
    liveStream.status = data.status || liveStream.status;
    if (flag == 0) {
      liveStream.views = Number(liveStream.views) + data.views || liveStream.views;
      liveStream.likes = Number(liveStream.likes) + data.likes || liveStream.likes;
    } else {
      liveStream.views = data.views || liveStream.views;
      liveStream.likes = data.likes || liveStream.likes;
    }
    return liveStream.save();
  }

  async updateCount(id, length, tag, view) {
    const liveStream = await this.load(id);
    let fakeViews = 0;
    let fakeLikes = 0;
    const timelist = [20, 60, 120, 240, 420, 660, 1200];
    const viewlimit = [3, 6, 11, 21, 31, 46, 60];
    const likelimit = [2, 4, 8, 17, 25, 34, 45];
    let index = 0;

    timelist.forEach((item) => {
      if (length > item) { index++; }
    });

    if (timelist[index] && index > 0) {
      fakeViews = getRandomInt(viewlimit[index], viewlimit[index - 1]);
      fakeLikes = getRandomInt(likelimit[index], likelimit[index - 1]);
    } else if (index == 0) {
      fakeViews = getRandomInt(viewlimit[index], 1);
      fakeLikes = getRandomInt(likelimit[index], 1);
    }


    if (!liveStream) {
      throw Error(`Live Stream "${id}" does not exist!`);
    }

    if (view == "view" && tag == "real") {
      liveStream.realViews += 1;
    } else if (view == "like" && tag == "real") {
      liveStream.realLikes += 1;
    } else {
      liveStream.fakeLikes += fakeLikes;
      liveStream.fakeViews += fakeViews;
    }

    return liveStream.save();
  }

  async getBySlug(slug) {
    return this.model.findOne({ slug });
  }

  async getByIds(ids) {
    return this.model.find({ _id: ids });
  }

  async getAll(query = {}) {
    return this.model.find(query);
  }

  async getOne(query = {}) {
    return this.model.findOne(query);
  }

  async get({ filter, sort, page }) {
    return this.model
      .find(
        transformFilter(filter),
        null,
        {
          sort: transformSortInput(sort),
          limit: page.limit,
          skip: page.skip,
        },
      );
  }

  async getTotal(filter) {
    return this.model
      .countDocuments(
        transformFilter(filter),
      );
  }

  async getViews(id) {
    const liveStream = await this.load(id);
    return Number(liveStream.fakeViews) + Number(liveStream.realViews);
  }

  async getLikes(id) {
    const liveStream = await this.load(id);
    return Number(liveStream.fakeLikes) + Number(liveStream.realLikes);
  }

  async es_search(filter, page) {
    return this.model.find(elasticFilter(filter), null, {
      limit: page.limit,
      skip: page.skip,
    });
  }

  async getTotal_es(filter) {
    return this.model.countDocuments(elasticFilter(filter));
  }

  async updateStatus(id, status) {
    const liveStream = await this.load(id);
    if (!liveStream) {
      throw Error(`Live Stream "${id}" does not exist!`);
    }

    liveStream.status = status;
    return liveStream.save();
  }

  async getPreviousStream(id) {
    return this.load(id)
      .then(async (currentStream) => {
        const prevStreams = await this.model.find(
          { 
            status: {$in: publicStatuses},
            createdAt: { $lt: currentStream.createdAt }
          },
          null,
          {
            sort: { createdAt: -1 },
            limit: 1
          }
        );
        if (prevStreams.length) return prevStreams[0];
        return this.model.findOne({status: {$in: publicStatuses}}, 
          null, 
          { sort: { createdAt: -1 } });
      });
  }

  async getNextStream(id) {
    return this.load(id)
      .then(async (currentStream) => {
        const nextStreams = await this.model.find(
          { 
            status: {$in: publicStatuses},
            createdAt: { $gt: currentStream.createdAt }
          },
          null,
          {
            sort: { createdAt: 1 },
            limit: 1
          }
        );
        if (nextStreams.length) return nextStreams[0];
        return this.model.findOne({status: {$in: publicStatuses}}, null, { sort: { createdAt: 1 } });
      });
  }
}

module.exports = LiveStreamRepository;
