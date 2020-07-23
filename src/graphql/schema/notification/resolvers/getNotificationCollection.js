
module.exports = async (_, { filter, page }, { dataSources: { repository }, user }) => {
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };

  filter.user = user.id;

  return Promise.all([
    repository.notification.get({ filter, page }),
    repository.notification.getTotal(filter),
  ])
    .then(([collection, total]) => ({
      collection,
      pager: { ...pager, total },
    }));
};
