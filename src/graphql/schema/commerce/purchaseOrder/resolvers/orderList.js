/* eslint-disable no-param-reassign */
const { Promise } = require('bluebird');

module.exports = async (_, {
  filter, page, sort,
}, { dataSources: { repository } }) => {
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };
  
  return Promise.all([
    repository.purchaseOrder.get({ filter, page, sort }),
    repository.purchaseOrder.getTotal(filter),
  ])
    .then(([collection, total]) => ({
      collection,
      pager: { ...pager, total },
    }));
};
