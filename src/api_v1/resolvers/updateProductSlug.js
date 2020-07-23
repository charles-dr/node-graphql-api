
const path = require('path');
const { slugify } = require('transliteration');

const repository = require(path.resolve('src/repository'));
const logger = require(path.resolve('config/logger'));

const activity = {
  processBatch: (skip, limit) => {
    const query = { slug: { $exists: false } };
    return repository.product.model.find(query, null, {
      skip, limit,
      sort: { title: 1 },
    }).then((products) => Promise.all(products.map((product) => {
      return repository.product.model.find({ title: product.title, _id: { $ne: product._id } })
        .then((productsWithSameTitle) => {
          if (productsWithSameTitle.length > 0) {
            product.slug = slugify(product.title) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          } else {
            product.slug = slugify(product.title);
          }
          return product.save();
        })
    })));
  },
}

module.exports = async (req, res) => {
  const batch = 200;
  const query = { slug: { $exists: false } };
  return repository.product.model.countDocuments(query).then(async (total) => {
    // console.log('[Total]', total);
    // return res.json({ total });
    const nIter = Math.ceil(total / batch);
    for (let i = 0; i < nIter; i++) {
      await activity.processBatch(i * batch, batch)
        .catch((e) => {
          console.log(`[Batch][${i * batch}-${(i + 1) * batch}]`, e);
        });
      logger.info(`[Batch][${i * batch}-${(i + 1) * batch}] done.`);
    }
    logger.info(`[REST][ProductSlug] updated ${total} products`);
    return res.json({ status: true, total });
  })
  .catch((e) => res.json({ status: false, message: e.message }));
}
