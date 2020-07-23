const uuid = require('uuid/v4');
const { Types } = require('mongoose');

class UserHasMessageThreadRepository {
  constructor(model) {
    this.model = model;
  }

  async findOne(threadId, userId) {
    if (typeof threadId !== 'string') {
      throw new Error(`UserHasMessageThread.findOne expected id as String, but got "${typeof threadId}"`);
    }
    if (typeof userId !== 'string') {
      throw new Error(`UserHasMessageThread.findOne expected id as String, but got "${typeof userId}"`);
    }

    return this.model.findOne({ thread: threadId, user: userId });
  }

  async create(data) {
    const userHasMessageThread = new this.model({
      _id: uuid(),
      ...data,
    });
    return userHasMessageThread.save();
  }

  async updateTime(threadId, userId, time) {
    return this.findOne(threadId, userId)
      .then((userHasMessageThread) => {
        if (!userHasMessageThread) {
          return this.create({
            _id: uuid(),
            thread: threadId,
            user: userId,
            readBy: time,
          });
        }

        userHasMessageThread.readBy = time;
        return userHasMessageThread.save();
      });
  }
}

module.exports = UserHasMessageThreadRepository;
