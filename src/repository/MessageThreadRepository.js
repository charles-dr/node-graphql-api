const uuid = require('uuid/v4');

class MessageThreadRepository {
  constructor(model) {
    this.model = model;
  }

  async findOne(id) {
    return this.model.findOne({ _id: id });
  }

  async findByIds(ids) {
    if (!ids) {
      return [];
    }

    if (!Array.isArray(ids)) {
      throw new Error(`MessageThread.findByIds expected ids as Array, but got "${typeof ids}"`);
    }

    if (ids.length === 0) {
      return [];
    }

    return this.model.find({ _id: { $in: ids } });
  }

  async findByIdsAndParticipants(ids, participants) {
    if (!Array.isArray(ids)) {
      throw new Error(`MessageThread.findByIdsAndParticipants expected ids as array, but got "${typeof ids}"`);
    }

    if (!Array.isArray(participants)) {
      throw new Error(`MessageThread.findByIdsAndParticipants expected participents as Array, but got "${typeof participants}"`);
    }

    const query = {
      $and: [
        { _id: { $in: ids } },
      ],
    };

    query.$and = query.$and.concat(
      participants.map((id) => ({ participants: { $eq: id } })),
    );
    return this.model.findOne(query);
  }

  async findAllByIdsAndParticipants(ids, participants) {
    if (!Array.isArray(ids)) {
      throw new Error(`MessageThread.findByIdsAndParticipants expected ids as array, but got "${typeof ids}"`);
    }

    if (!Array.isArray(participants)) {
      throw new Error(`MessageThread.findByIdsAndParticipants expected participents as Array, but got "${typeof participants}"`);
    }

    const query = {
      $and: [
        { _id: { $in: ids } },
      ],
    };

    query.$and = query.$and.concat(
      participants.map((id) => ({ participants: { $eq: id } })),
    );
    return this.model.find(query);
  }

  async create(data) {
    const message = new this.model({
      _id: uuid(),
      ...data,
    });
    return message.save();
  }

  async updateTime(threadId) {
    return this.model.findOneAndUpdate(
      { _id: threadId },
      { lastUpdate: Date.now() },
      { new: true },
    );
  }

  async getWithTotal({ filter, page }) {
    let filterQuery = {};
    if (filter.hasUnreads == null) {
      filterQuery = {
        $or: [
          { 'userhasmessagethread.hidden': false },
          { userhasmessagethread: null, 'messages.0': { $exists: true } },
        ],
      };
    } else if (filter.hasUnreads) {
      filterQuery = {
        $or: [
          { 'userhasmessagethread.hidden': false, unreadMessages: { $exists: true, $ne: [] } },
          { userhasmessagethread: null, 'messages.0': { $exists: true } },
        ],
      };
    } else {
      filterQuery = { 'userhasmessagethread.hidden': false, unreadMessages: [] };
    }
    if (filter.liveStream) {
      filterQuery.$and = [{ tags: {$eq: `LiveStream:${filter.liveStream}`} }];
    }

    const aggregation = [
      {
        $match: { participants: filter.user },
      },
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'thread',
          as: 'messages',
        },
      },
      {
        $lookup: {
          from: 'userhasmessagethreads',
          localField: '_id',
          foreignField: 'thread',
          as: 'userhasmessagethread',
        },
      },
      {
        $addFields: {
          id: '$_id',
          userhasmessagethread: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$userhasmessagethread',
                  as: 'hasthread',
                  cond: {
                    $eq: ['$$hasthread.user', filter.user],
                  },
                },
              }, 0],
          },
        },
      },
      {
        $addFields: {
          unreadMessages: {
            $filter: {
              input: '$messages',
              as: 'message',
              cond: {
                $gt: ['$$message.createdAt', '$userhasmessagethread.readBy'],
              },
            },
          },
        },
      },
      {
        $match: filterQuery,
      },
      { $group: { _id: null, total: { $sum: 1 }, collection: { $push: '$$ROOT' } } },
      { $skip: page.skip },
    ];

    if (page.limit) {
      aggregation.push({ $limit: page.limit });
    }
    return this.model.aggregate(aggregation)
      .then((data) => (data.length > 0 ? data[0] : { collection: [], total: 0 }));
  }
}

module.exports = MessageThreadRepository;
