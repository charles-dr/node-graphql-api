module.exports = async (_, {
  category, searchKey, page,
}, { dataSources: { repository } }) => {
  const result = [];
  let total = 0;
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };
  if (category == 'All' || category == 'Products') {
    await Promise.all([
      repository.product.es_search(searchKey, page),
      repository.product.getTotal_es(searchKey),
    ]).then(([res, nums]) => {
      res.map((item) => {
        result.push({
          title: item.title ? item.title : '',
          id: item.id,
          assets: item.assets,
          type: 'product',
        });
      });
      total += nums;
    });
  }

  if (category == 'All' || category == 'LiveStreams') {
    await Promise.all([
      repository.liveStream.es_search(searchKey, page),
      repository.liveStream.getTotal_es(searchKey),
    ])
      .then(([res, nums]) => {
        res.map((item) => {
          result.push({
            title: item.title ? item.title : '',
            id: item.id,
            assets: item.preview,
            type: 'livestream',
          });
        });
        total += nums;
      });
  }

  if (category == 'All' || category == 'Profiles') {
    await Promise.all([
      repository.user.es_search(searchKey, page),
      repository.user.getTotal_es(searchKey),
    ])
      .then(([res, nums]) => {
        res.map((item) => {
          result.push({
            title: item.name ? item.name : '',
            id: item.id,
            assets: item.photo,
            type: 'profile',
          });
        });
        total += nums;
      });
  }
  return { collection: result, pager: { ...pager, total } };
};
