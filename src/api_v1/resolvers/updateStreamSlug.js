
const path = require('path');
const { slugify } = require('transliteration');

const repository = require(path.resolve('src/repository'));
const logger = require(path.resolve('config/logger'));

const activity = {
  processBatch: (skip, limit) => {
    const query = { slug: { $exists: false } };
    return repository.liveStream.model.find(query, null, {
      skip, limit,
      sort: { title: 1 },
    }).then((streams) => Promise.all(streams.map((stream) => {
      return repository.liveStream.model.find({ title: stream.title, _id: { $ne: stream._id } })
        .then((streamsWithSameTitle) => {
          if (streamsWithSameTitle.length > 0) {
            stream.slug = slugify(stream.title) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          } else {
            stream.slug = slugify(stream.title);
          }
          return stream.save();
        })
    })));
  },
}

module.exports = async (req, res) => {
  const batch = 200;
  const query = { slug: { $exists: false } };
  return repository.liveStream.model.countDocuments(query).then(async (total) => {
    const nIter = Math.ceil(total / batch);
    for (let i = 0; i < nIter; i++) {
      await activity.processBatch(i * batch, batch)
        .catch((e) => {
          console.log(`[Batch][${i * batch}-${(i + 1) * batch}]`, e);
        });
      logger.info(`[Batch][${i * batch}-${(i + 1) * batch}] done.`);
    }
    logger.info(`[REST][StreamSlug] updated ${total} streams`);
    return res.json({ status: true, total });
  })
  .catch((e) => res.json({ status: false, message: e.message }));
}
