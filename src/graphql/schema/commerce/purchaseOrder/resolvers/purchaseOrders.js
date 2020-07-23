const path = require('path');
const MiniSearch = require('minisearch');

const UnFulfilledStatuses = [ "CREATED", "ORDERED" ];
const DispatchedStatuses = [ "CARRIER_RECEIVED", "DELIVERED", "COMPLETE" ];

const activity = {
  querySearch: ({ searchQuery, user }, repository) => {
    const mapItemToOrder = {};
    const mapProductToItem = {};
    let _orders = [];
    let _items = [];
    return repository.purchaseOrder.find({ user }).then((purchaseOrders) => {
      purchaseOrders.forEach(order => {
        order.items.forEach(itemId => {
          mapItemToOrder[itemId] = order.id;
        })
      });
      _orders = purchaseOrders;
      return repository.orderItem.getByIds(purchaseOrders.reduce((itemIds, order) => itemIds = itemIds.concat(order.items), []))
    })
      .then(orderItems => {
        _items = orderItems;
        orderItems.forEach(item => {
          mapProductToItem[item.product] = [...(mapProductToItem[item.product] || []), item.id];
        });
        return repository.product.getByIds(orderItems.map(item => item.product));
      })
      .then((products) => {
        const miniSearchBase = products.map(product => ({
          id: product.id,
          title: product.title,
          description: product.description,
          hashtags: product.hashtags.join(' '),
        }));
        const miniSearch = new MiniSearch({
          fields: ['title', 'description', 'hashtags'],
          storeFields: ['id'],
        });
        miniSearch.addAll(miniSearchBase);
        const results = miniSearch.search(searchQuery);

        const filteredOrders = results.map((result) => mapProductToItem[result.id])   // array of order items ids - 2D array
          .reduce((_itemIds, itemIds) => _itemIds = _itemIds.concat(itemIds) , [])  // item ids - 1D array
          .filter((itemId, i, self) => self.indexOf(itemId) === i)  // unique ids of order items
          .map((itemId) => mapItemToOrder[itemId]);
        return filteredOrders;
      })
  },
}

module.exports = async (_, { filter = {}, sort = {}, page }, { dataSources: { repository }, user}) => {
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };

  filter.buyer = user.id;
  if (filter.searchQuery) {
    const ids = await activity.querySearch({ searchQuery: filter.searchQuery, user }, repository);
    filter.ids = ids;
  }
  return Promise.all([
    repository.purchaseOrder.get(filter, sort, page),
    repository.purchaseOrder.getTotal(filter),
  ])
    .then(([collection, total]) => {
      return {
        collection
        ,
        pager: { ...pager, total },
      };
    })
}

