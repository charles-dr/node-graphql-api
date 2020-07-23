const path = require('path');

const { StreamChannelStatus, StreamRecordStatus } = require(path.resolve('src/lib/Enums'));

class StreamChannelRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ _id: id });
  }

  async create(data) {
    const channel = new this.model(data);

    return channel.save();
  }

  async getAll(query = {}) {
    return this.model.find(query);
  }

  async update(id, data) {
    const channel = await this.load(id);
    if (!channel) {
      throw Error(`Stream Channel "${id}" does not exist!`);
    }

    channel.status = data.status || channel.status;
    channel.startedAt = data.startedAt || channel.startedAt;
    channel.finishedAt = data.finishedAt || channel.finishedAt;

    return channel.save();
  }

  async start(id) {
    return this.model.findOneAndUpdate({
      _id: id,
    },
    {
      status: StreamChannelStatus.STREAMING,
      startedAt: Date.now(),
    },
    {
      new: true,
    });
  }

  async finish(id) {
    return this.model.findOneAndUpdate({
      _id: id,
    },
    {
      status: StreamChannelStatus.FINISHED,
      finishedAt: Date.now(),
    },
    {
      new: true,
    });
  }

  async startRecording(id, recordInfo) {
    return this.model.findOneAndUpdate({
      _id: id,
    },
    {
      $set: {
        'record.resourceId': recordInfo.resourceId,
        'record.sid': recordInfo.sid,
        'record.status': StreamRecordStatus.RECORDING,
      },
    },
    {
      new: true,
    });
  }

  async finishRecording(id, sources) {
    return this.model.findOneAndUpdate({
      _id: id,
    },
    {
      $set: {
        'record.sources': sources,
        'record.status': StreamRecordStatus.FINISHED,
      },
    },
    {
      new: true,
    });
  }

  async failRecording(id) {
    return this.model.findOneAndUpdate({
      _id: id,
    },
    {
      $set: {
        'record.status': StreamRecordStatus.FAILED,
      },
    },
    {
      new: true,
    });
  }
  
  async updateStatus(id, status) {
    const channel = await this.load(id);
    if (!channel) { throw Error(`Live Stream "${id}" does not exist!`); }

    channel.status = status;
    return channel.save();
  }
}

module.exports = StreamChannelRepository;
