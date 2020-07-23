const uuid = require('uuid/v4');

function transformFilter({
  type, isRead, user,
}) {
  const query = {};

  if (type) {
    query.type = type;
  }

  if (isRead) {
    query.isRead = isRead;
  }

  if (user) {
    query.user = user;
  }

  return query;
}

class NotificationRepository {
  constructor(model) {
    this.model = model;
  }

  async findOne(id) {
    return this.model.findOne({ _id: id });
  }

  async create(data) {
    const notification = new this.model({
      _id: uuid(),
      ...data,
    });
    return notification.save();
  }

  async get({ filter, page }) {
    return this.model
      .find(
        transformFilter(filter),
        null,
        {
          sort: { createdAt: -1 },
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
}

module.exports = NotificationRepository;
