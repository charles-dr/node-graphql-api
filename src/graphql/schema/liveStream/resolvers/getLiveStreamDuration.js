const path = require('path');

const { StreamChannelStatus } = require(path.resolve('src/lib/Enums'));

const durationSrategy = {
  [StreamChannelStatus.PENDING]: () => 0,
  [StreamChannelStatus.STREAMING]: (start) => Math.floor((Date.now() - start.getTime()) / 1000),
  [StreamChannelStatus.FINISHED]: (start, end) => Math.floor((end.getTime() - start.getTime()) / 1000),
  [StreamChannelStatus.CANCELED]: (start, end) => Math.floor((end.getTime() - start.getTime()) / 1000),
  [StreamChannelStatus.ARCHIVED]: (start, end) => Math.floor((end.getTime() - start.getTime()) / 1000),
};

module.exports = async (liveStream, args, { dataSources: { repository } }) => repository.streamChannel.load(liveStream.channel)
  .then((channel) => durationSrategy[channel.status](channel.startedAt, channel.finishedAt));
