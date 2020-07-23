/* eslint-disable no-param-reassign */
const { Promise } = require('bluebird');

module.exports = async (_, {
  filter, page, sort,
}, { dataSources: { repository }, user }) => {
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };

  return Promise.all([
    repository.saleOrder.get({
      filter, page, sort, user,
    }),
    repository.saleOrder.getTotal(filter, user),
  ])
    .then(([collection, total]) => ({
      collection,
      pager: { ...pager, total },
    }));
};
