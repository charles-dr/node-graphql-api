
module.exports = async (_, { filter, page }, { dataSources: { repository }, user }) => {
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };

  filter.user = user.id;

  return repository.messageThread.getWithTotal({ filter, page })
    .then((data) => ({
      collection: data.collection,
      pager: { ...pager, total: data.total },
    }));
};
