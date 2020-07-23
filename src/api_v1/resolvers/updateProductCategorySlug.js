const path = require('path');
const { slugify } = require('transliteration');

const repository = require(path.resolve('src/repository'));
const logger = require(path.resolve('config/logger'));

const activity = {
  processBatch: (skip, limit) => {
    const query = {  };
    return repository.productCategory.model.find(query, null, {
      skip, limit,
      sort: { title: 1 },
    }).then((productCategories) => Promise.all(productCategories.map((category) => {
      return repository.productCategory.model.find({ name: category.name, _id: { $ne: category._id } })
        .then((categoryWithSameName) => {
          if (categoryWithSameName.length > 0) {
            category.slug = slugify(category.name) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          } else {
            category.slug = slugify(category.name);
          }
          return category.save();
        })
    })));
  },
}

module.exports = async (req, res) => {
  const batch = 100;
  const query = {  };

  return repository.productCategory.model.countDocuments(query).then(async (total) => {
    const nIter = Math.ceil(total / batch);
    for (let i = 0; i < nIter; i++) {
      await activity.processBatch(i * batch, batch)
        .catch((e) => {
          console.log(`[Batch][${i * batch}-${(i + 1) * batch}]`, e);
        });
      logger.info(`[Batch][${i * batch}-${(i + 1) * batch}] done.`);
    }
    logger.info(`[REST][ProductCategorySlug] updated ${total} categories`);
    return res.json({ status: true, total });
  })
  .catch((e) => res.json({ status: false, message: e.message }));
}
