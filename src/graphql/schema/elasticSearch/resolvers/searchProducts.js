const MiniSearch = require('minisearch');

function paginate(array, page_size, page_skip) {
  // human-readable page numbers usually start with 1, so we reduce 1 in the first argument
  return (array.length > 0) ? array.slice(page_skip, page_skip + page_size) : [];
}

module.exports = async (_, {
  searchKey, page,
}, { dataSources: { repository } }) => {
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };
  let searchSubKeys = [];
  let searchWords = [];
  searchWords.push(searchKey);
  searchWords = searchWords.concat(searchKey.split(' '));

  // search brand and category by words
  const brandInfo = await repository.brand.findByNames(searchWords);
  const categoryInfo = await repository.productCategory.findByNames(searchWords);

  if (brandInfo && brandInfo.name) {
    searchKey = searchKey.replace(brandInfo.name, '');
    searchKey = searchKey.replace('  ', ' ');
  }
  if (categoryInfo && categoryInfo.name) {
    searchKey = searchKey.replace(categoryInfo.name, '');
    searchKey = searchKey.replace('  ', ' ');
  }
  searchKey = searchKey.trim();

  if (searchKey.length > 5) {
    if (searchKey.split(' ').length == 2) {
      searchSubKeys = searchKey.split(' ');
    } else {
      const subLength = searchKey.length / 2;
      searchSubKeys.push(searchKey.substr(0, subLength));
      searchSubKeys.push(searchKey.substr(subLength, searchKey.length));
    }
  } else {
    searchSubKeys.push(searchKey);
  }
  const list = await repository.product.getAllProductsByBrandAndCategory(brandInfo ? brandInfo.id : null, categoryInfo ? categoryInfo.id : null, searchSubKeys);
  // search engine
  const miniSearch = new MiniSearch({
    fields: [
      // 'brandNames',
      'title',
      // 'categoryNames',
      'hashtagNames',
      // 'attrValues',
      'description',
    ],
    extractField: (document, fieldName) => {
      if (fieldName == 'brandNames') {
        let brandNames = '';
        document.brand && document.brand.map((brand) => {
          brandNames += (`${brand.name} `);
        });
        return brandNames;
      } if (fieldName == 'categoryNames') {
        let categoryNames = '';
        if (!document.category) console.log('document => ', document.id);
        document.category && document.category.map((category) => {
          categoryNames += (`${category.name} `);
        });
        return categoryNames;
      } if (fieldName == 'hashtagNames') {
        let hashtagNames = '';
        document.hashtags && document.hashtags.map((tag) => {
          hashtagNames += (`${tag.name} `);
        });
        return hashtagNames;
      } if (fieldName == 'attrValues') {
        let values = '';
        document.attrs && document.attrs.map((attr) => {
          attr.variation && attr.variation.map((item) => {
            values += (`${item.value} `);
          });
        });
        return values;
      }

      return fieldName.split('.').reduce((doc, key) => doc && doc[key], document);
    },
    searchOptions: {
      // boost: { title: 0 },
      fuzzy: 0.2,
    },
    storeFields: [
      'id',
      // 'title',
      // 'attrs',
      // 'description',
      // 'hashtags',
      // 'href',
      // 'category',
      // 'brand',
      // 'price',
      // 'quantity',
      // 'assets',
      // 'thumbnail',
      // 'seller',
      // 'rating',
      // 'sku',
      // 'status',
      // 'relatedLiveStreams',
      // 'shippingBox',
      // 'customCarrier',
      // 'currency'
    ],
  });

  // Index all documents
  miniSearch.addAll(list);

  // Search with default options
  const search_results = miniSearch.search(searchKey);
  const results = await repository.product.getAllProductsByIDs(paginate(search_results.map((item) => item.id), pager.limit, pager.skip));

  return {
    collection: results,
    pager: { ...pager, total: search_results.length },
  };
};
