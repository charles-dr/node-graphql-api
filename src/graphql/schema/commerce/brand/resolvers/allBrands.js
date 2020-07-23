const path = require('path');
const { StreamChannelStatus } = require(path.resolve('src/lib/Enums'));

const activity = {
  getAvailableLiveStreamWithProudcts: async (repository) => {
    const query = { $and: [] };
    query.$and.push({ status: {$in: [StreamChannelStatus.STREAMING, StreamChannelStatus.FINISHED]} });
    query.$and.push({ "productDurations.0": {$exists: true} });
    return repository.liveStream.getAll(query);
  },
  getBrandIds4Streams: async (liveStreams, repository) => {
    const productIds = liveStreams.reduce((ids, liveStream) => ids = ids.concat(liveStream.productDurations.map(pd => pd.product)), []);
    return repository.product.getByIds(productIds)
      .then(products => products.map(product => product.brand));
  },
}

module.exports = async (_, { hasProduct, hasLiveStream }, { dataSources: { repository } }) => {
  const query = {};
  if (typeof hasProduct === 'boolean' && hasProduct) query.nProducts = { $gt: 0 };
  else if (typeof hasProduct === 'boolean' && !hasProduct) query.nProducts = { $eq: 0 };

  if (hasLiveStream) {
    const brandIds = await activity.getAvailableLiveStreamWithProudcts(repository)
      .then(liveStreams => activity.getBrandIds4Streams(liveStreams, repository));
    query._id = { $in: brandIds };
  }

  return repository.brand.getAll(query)
    .then((brands) => {
      brands.sort((a, b) => {
        const name1 = a.name.toLowerCase();
        const name2 = b.name.toLowerCase();
        const startWithAlphaBet1 = !!(name1.charAt(0).match(/[a-z]/i));
        const startWithAlphaBet2 = !!(name2.charAt(0).match(/[a-z]/i));

        if (startWithAlphaBet1 !== startWithAlphaBet2) {
          return !startWithAlphaBet1 ? 1 : -1;
        }
        return name1 > name2 ? 1 : -1;   
      });
      return brands;
    });
};
