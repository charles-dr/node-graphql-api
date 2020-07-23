const path = require('path');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

module.exports = async (_, { filter, sort, page }, { dataSources: { repository }, user }) => {
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };

  filter.user = user.id;

  return Promise.all([
    repository.issue.get({ filter, page, sort }),
    repository.issue.getTotal(filter),
  ])
    .then(([ collection, total ]) => ({
      collection,
      pager: { ...pager, total },
    }))
    .catch(error => {
      throw errorHandler.build([error]);
    })
}
