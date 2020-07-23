const uuid = require('uuid/v4');

function transformSortInput({ feature = 'CREATED_AT', type = 'DESC' }) {
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

class MessageRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ _id: id });
  }

  async addMessage(data) {
    const message = new this.model({
      _id: uuid(),
      ...data,
    });
    return message.save();
  }

  async get({
    blackList, thread, skip, limit, sort = {},
  }) {
    const query = {
      thread,
    };
    if (blackList && blackList.length > 0) {
      query.author = { $nin: blackList };
    }

    const filterFns = { DESC: '$lte', ASC: '$gte' };
    if (skip) {
      query.createdAt = { [filterFns[sort.type]]: skip };
    }

    return this.model
      .find(
        query,
        null,
        {
          sort: transformSortInput(sort),
          limit,
        },
      );
  }

  async getUnreadByTime({ blackList, thread, time }) {
    const query = {
      thread,
      createdAt: { $gt: time },
    };
    if (blackList && blackList.length > 0) {
      query.author = { $nin: blackList };
    }
    return this.model.find(query);
  }
}

module.exports = MessageRepository;
