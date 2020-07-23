

module.exports = async (_, { filter, sort, page }, { dataSources: { repository } }) => {
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };

  return Promise.all([
    repository.theme.get({ filter, sort, page }),
    repository.theme.getTotal(filter),
  ])
    .then(([ collection, total ]) => {
      return {
        collection,
        pager: { ...pager, total },
      };
    })
}
