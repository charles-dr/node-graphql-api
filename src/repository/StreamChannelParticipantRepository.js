const path = require('path');

const { StreamChannelStatus } = require(path.resolve('src/lib/Enums'));

class StreamChannelParticipantRepository {
  constructor(model) {
    this.model = model;
  }

  async load(channelId, userId) {
    return this.model.findOne({ channel: channelId, user: userId });
  }

  async create(data) {
    const participant = new this.model(data);

    return participant.save();
  }

  async getChannelParticipants(channelId) {
    return this.model.find({ channel: channelId });
  }

  async getParticipantActiveChannels(userId) {
    return this.model.find({ user: userId, leavedAt: null });
  }

  async getViewersCount(channelId) {
    return this.model.aggregate([
      {
        $match: { channel: channelId, isPublisher: false },
      }, {
        $lookup: {
          from: 'streamchannels',
          localField: 'channel',
          foreignField: '_id',
          as: 'streamchannel',
        },
      }, {
        $match: {
          $or: [
            { 'streamchannel.0.status': StreamChannelStatus.FINISHED },
            { 'streamchannel.0.status': { $ne: StreamChannelStatus.FINISHED }, leavedAt: null },
          ],
        },
      }, { $count: 'count' }]).then((data) => (data.length === 0 ? 0 : data[0].count));
  }

  async leaveStream(channelId, userId) {
    return this.model.findOneAndUpdate(
      { channel: channelId, user: userId },
      { leavedAt: Date.now() },
      { new: true },
    );
  }

  /**
   * @deprecated
   */
  async rejoinStream(channelId, userId) {
    return this.model.findOneAndUpdate(
      { channel: channelId, user: userId },
      { leavedAt: null },
      { new: true },
    );
  }
}

module.exports = StreamChannelParticipantRepository;
