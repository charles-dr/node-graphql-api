/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
const path = require('path');
const NodeCache = require('node-cache');
const async = require('async');

const BaseRobot = require('./BaseRobot');

const logger = require(path.resolve('config/logger'));
const { VideoTag, StreamChannelStatus } = require('../../lib/Enums');
const LiveStreamModel = require(path.resolve('src/model/LiveStreamModel'));
const repository = require(path.resolve('src/repository'));

const cache = new NodeCache();
const CONFIG_KEY = 'LiveStreamVideoTag';
const streamAvailableStatuses = [StreamChannelStatus.FINISHED, StreamChannelStatus.STREAMING];

const activity = {
  start: async () => {
    console.log('[LiveStreamVideoTag] start');
    const config = cache.get(CONFIG_KEY);

    // mark the bot as running.
    cache.set(CONFIG_KEY, { ...config, running: true });

    return activity.processTrending()
      .then(() => activity.processHot())
      .then(() => {
        // mark the bot as stop.
        cache.set(CONFIG_KEY, { ...config, running: false });
        console.log('[]')
      });
  },
  processTrending: () => {
    const whereAvailable = {
      status: { $in: streamAvailableStatuses },
    };
    const whereTrending = {
      videoTags: VideoTag.Trending,
    };
    const paginateStream = async ({ skip, limit }) => {
      if (limit === 0) return [];
      return LiveStreamModel.find(
        whereAvailable,
        null,
        { limit, skip, sort: { realLikes: -1 } },
      );
    }
    const markAsTrendingStream = (stream) => {
      const videoTags = stream.videoTags;
      videoTags.push(VideoTag.Trending);
      stream.videoTags = videoTags.filter((tag, i, self) => self.indexOf(tag) === i);
      return activity.saveLiveStream(stream);
    }
    const markAsNotTrendingStream = (stream) => {
      const videoTags = stream.videoTags;
      const index = videoTags.indexOf(VideoTag.Trending);
      videoTags.splice(index, 1);
      stream.videoTags = videoTags;
      return activity.saveLiveStream(stream);
    }
    return Promise.resolve()
      .then(async () => {
        const total = await LiveStreamModel.countDocuments(whereAvailable);
        const nTrending = Math.floor(total * 0.15);
        const batch = 100;
        const nBatch = Math.ceil(nTrending / batch);
        // add 'Trending' tag to the top streams.
        for (let i = 0; i < nBatch; i ++) {
          await paginateStream({ skip: i * batch, limit: Math.min(batch, nTrending - i * batch) })
            .then(streams => Promise.all(streams.map(stream => markAsTrendingStream(stream))));
        }
        
        // process rank-downed streams.
        const total2 = await LiveStreamModel.countDocuments({ ...whereAvailable, ...whereTrending });
        const totalDown = total2 - nTrending;

        await paginateStream({ skip: nTrending, limit: totalDown })
          .then(streams => Promise.all(streams.map(stream =>  markAsNotTrendingStream(stream))));
      })
      .catch(error => {
        console.log('[StreamTagBot][Trending]', error.message);
      });
  },
  processHot: () => {
    const whereAvailable = {
      status: { $in: streamAvailableStatuses },
    };
    const whereHot = {
      videoTags: VideoTag.Hot,
    };
    const paginateStream = async ({ skip, limit }) => {
      if (limit === 0) return [];
      return LiveStreamModel.find(
        whereAvailable,
        null,
        { limit, skip, sort: { realViews: -1 } },
      );
    }
    const markAsHotStream = (stream) => {
      const videoTags = stream.videoTags;
      videoTags.push(VideoTag.Hot);
      stream.videoTags = videoTags.filter((tag, i, self) => self.indexOf(tag) === i);
      return activity.saveLiveStream(stream);
    }
    const markAsNotHotStream = (stream) => {
      const videoTags = stream.videoTags;
      const index = videoTags.indexOf(VideoTag.Hot);
      videoTags.splice(index, 1);
      stream.videoTags = videoTags;
      return activity.saveLiveStream(stream);
    }
    return Promise.resolve()
      .then(async () => {
        const total = await LiveStreamModel.countDocuments(whereAvailable);

        const nHot = Math.floor(total * 0.15);
        const batch = 100;
        const nBatch = Math.ceil(nHot / batch);
        // add 'Trending' tag to the top streams.
        for (let i = 0; i < nBatch; i ++) {
          await paginateStream({ skip: i * batch, limit: Math.min(batch, nHot - i * batch) })
            .then(streams => Promise.all(streams.map(stream => markAsHotStream(stream))));
        }
        
        // process rank-downed streams.
        const total2 = await LiveStreamModel.countDocuments({ ...whereAvailable, ...whereHot });
        const totalDown = total2 - nHot;

        await paginateStream({ skip: nHot, limit: totalDown })
          .then(streams => Promise.all(streams.map(stream =>  markAsNotHotStream(stream))));
      })
      .catch(error => {
        console.log('[StreamTagBot][Hot]', error.message);
      });
  },
  saveLiveStream: (stream) => {
    stream.categories = stream.categories.filter(category => typeof category === 'string');
    return stream.save();
  }
};

module.exports = class LiveStreamVideoTagRobot extends BaseRobot {
  constructor() {
    super(180 * 60 * 1009);
    cache.set(CONFIG_KEY, { position: 0, limit: 100, running: false });
  }

  execute() {
    const config = cache.get(CONFIG_KEY);
    if (config.running) return;
    return Promise.all([
      activity.start(),
    ])
      .then(() => {
        super.execute();
      });
  }
};
