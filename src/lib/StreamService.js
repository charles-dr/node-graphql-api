
const path = require('path');
const { slugify } = require('transliteration');
const repository = require(path.resolve('src/repository'));
const { StreamChannelStatus, VideoTag } = require(path.resolve('src/lib/Enums'));


class StreamService {
  constructor(repository) {
    this.repository = repository;
  }

  async generateSlug({ id, slug: slugInput, title }) {
    return Promise.all([
      slugInput ? this.repository.liveStream.getBySlug(slugInput) : null,
      this.repository.liveStream.getAll({ title }),
    ])
      .then(([streamBySlug, streamsByTitle]) => {
        if (slugInput && (!streamBySlug || (streamBySlug && streamBySlug._id === id))) return slugInput;

        const otherStreams = streamsByTitle.filter(streams => stream._id !== id);
        let slug = slugify(title);
        if (otherStreams.length) {
          const rand = Math.floor(Math.random() * 1000);
          slug += `-${rand.toString().padStart(3, '0')}`;
        }
        return slug;
      })
  }

  async updateStreamStatus(liveStream, status) {
    if (!liveStream) return false;
    return this.repository.streamChannel.load(liveStream.channel)
      .then(streamChannel => {
        streamChannel.status = liveStream.status = status;
        videoTags = liveStream.videoTags || [];
        videoTags.push(VideoTag.Streaming);
        liveStream.videoTags = videoTags.filter((tag, i, self) => self.indexOf(tag) === i);
        return Promise.all([ liveStream.save(), streamChannel.save() ]);
      })
  }

  async updateStreamStatusByStream(liveStreamId, status) {
    return this.repository.liveStream.load(liveStreamId)
      .then(liveStream => this.updateStreamStatus(liveStream, status));
  }

  async updateStreamStatusByChannel(streamChannelId, status) {
    return this.repository.liveStream.getOne({ channel: streamChannelId })
      .then(liveStream => this.updateStreamStatus(liveStream, status));
  }

  async updateStreamCountOfCategory(id) {
    return Promise.all([
      this.repository.liveStreamCategory.getById(id),
      this.repository.liveStream.getTotal({ categories: [id], statuses: [ StreamChannelStatus.STREAMING ] }),
      this.repository.liveStream.getTotal({ categories: [id], statuses: [ StreamChannelStatus.FINISHED ] }),
    ])
      .then(([category, streaming, finished]) => {
        if (category) {
          category.nStreams = {streaming, finished};
          return category.save();
        } else {
          return null;
        }
      })
  }

  async updateStreamCountForExperience(id) {
    return Promise.all([
      this.repository.liveStreamExperience.getById(id),
      this.repository.liveStream.getTotal({ experiences: [id], statuses: [ StreamChannelStatus.STREAMING ] }),
      this.repository.liveStream.getTotal({ experiences: [id], statuses: [ StreamChannelStatus.FINISHED ] }),
    ])
      .then(([experience, streaming, finished]) => {
        if (experience) {
          experience.nStreams = { streaming, finished };
          return experience.save();
        } else {
          return null;
        }
      })
  }
}


module.exports = new StreamService(repository);