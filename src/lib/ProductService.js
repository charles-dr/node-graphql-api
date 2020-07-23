
const path = require('path');
const { slugify } = require('transliteration');
const uuid = require('uuid/v4');

const repository = require(path.resolve('src/repository'));
const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { InventoryLogType } = require(path.resolve('src/lib/Enums'));

const matchWeightByLevel = [7, 5, 3]; // for level 1, 2, 3

module.exports = {
  async analyzeTheme(id) {
    const themeContent = { brands: [], productCategories: [], hashtags: [] };

    if (!id) return themeContent;

    const theme = await repository.theme.getById(id);

    if (!theme) return themeContent;

    let { brandCategories, brands, productCategories, hashtags } = theme;

    if (brandCategories.length || hashtags.length) {
      brandCategories = await repository.brandCategory.getByIdsAndTags(brandCategories); //, hashtags
    }

    const brandCategoryIds = brandCategories.map(brandCategory => brandCategory._id);

    if (brandCategories.length || hashtags.length) {
      brands = await repository.brand.getByCategoryAndTags(brandCategoryIds); //, hashtags
    }

    if (productCategories.length || brands.length || hashtags.length) {
      if (brands.length) {
        brands.forEach(brand => {
          productCategories.concat(brand.productCategories);
        });
      }
      productCategories = await repository.productCategory.getUnderParents(productCategories);//, hashtags
    }

    return { brands, productCategories, hashtags: [] };
  },

  async generateSlug({ id, slug: slugInput, title }) {
    return Promise.all([
      slugInput ? repository.product.getBySlug(slugInput) : null,
      repository.product.getAll({ title }),
    ])
      .then(([productBySlug, productsByTitle]) => {
        if (slugInput && (!productBySlug || (productBySlug && productBySlug._id === id))) return slugInput;

        const otherProducts = productsByTitle.filter(product => product._id !== id);
        let slug = slugify(title);
        if (otherProducts.length) {
          const rand = Math.floor(Math.random() * 1000);
          slug += `-${rand.toString().padStart(3, '0')}`;
        }
        return slug;
      })
  },

  async findProductVariationsFromKeyword(keyword) {
    if (!keyword.trim()) return [];

    const keywords = keyword.split(' ').map(item => item.trim());

    const query = { $or: [] };
    query.$or = keywords.map(kwd => ({ hashtags: { $regex: `${kwd}`, $options: 'i' } }));

    return repository.productCategory.getAll(query)
      .then(productCategories => {
        if (productCategories.length === 0) return [];

        // calculate match count.
        productCategories.forEach(category => {
          category.matchPoint = this.calcKeywordMatchPoint(keywords, category);
        });

        // sort by match point.
        productCategories.sort((a, b) => b.matchPoint - a.matchPoint);
        
        const maxPoint = productCategories[0].matchPoint;
        
        return Promise.all(productCategories
          // .filter(item => item.matchPoint === maxPoint)
          .map(item => repository.productVariation.getByCategory(item._id))
        )
          .then((variationsArray) => {
            variationsArray = variationsArray.filter(el => el.length > 0);
            const [variations] = variationsArray.filter(el => el.length === Math.max(...variationsArray.map(el => el.length)));
            return variations || [];
          })
      })
  },

  async attributeFilter({ searchQuery: keyword }) {
    if (!keyword.trim()) return [];

    const keywords = keyword.split(' ').map(item => item.trim());

    const query = { $or: [] };
    query.$or = keywords.map(kwd => ({ hashtags: { $regex: `${kwd}`, $options: 'i' } }));

    return repository.productCategory.getAll(query)
      .then(productCategories => {
        if (productCategories.length === 0) return [];

        // calculate match count.
        productCategories.forEach(category => {
          category.matchPoint = this.calcKeywordMatchPoint(keywords, category);
        });

        // sort by match point.
        productCategories.sort((a, b) => b.matchPoint - a.matchPoint);
        
        const maxPoint = productCategories[0].matchPoint;
        
        return Promise.all(productCategories
          // .filter(item => item.matchPoint === maxPoint)
          .map(item => repository.productVariation.getByCategory(item._id))
        )
          .then((variationsArray) => {
            // WI = With Index.
            const pcWI = productCategories.map((item, i) => ({ index: i, value: item }));
            const vaWI = variationsArray.map((item, i) => ({ index: i, value: item }));

            const [pcWIbyName] = pcWI.filter(item => item.value.name === keyword);
            const [vaWI_MaxLen] = vaWI.filter(item => item.value.length === Math.max(...variationsArray.map(el => el.length)));

            const selIndex = pcWIbyName ? pcWIbyName.index : vaWI_MaxLen.index;
            
            return Promise.all([
              repository.productCategory.getByParent(pcWI[selIndex].value.id),
              vaWI[selIndex].value
            ]);
          })
          .then(([productCategories, productVariations]) => ({ productCategories, productVariations }))
      })
  },

  calcKeywordMatchPoint(keywords, { hashtags = [], level = 1}) {
    let matches = 0;
    for (const keyword of keywords) {
      const regExp = new RegExp(keyword, 'gi');
      for (const hashtag of hashtags) {
        const matched = hashtag.match(regExp);
        matches += matched ? matched.length : 0;
      }
    }
    return matches * matchWeightByLevel[level - 1];
  },

  composeHashtags(hashtags = [], brand) {
    if (brand && !hashtags.includes(brand.name)) {
      hashtags.includes(brand.name);
    }
    return hashtags;
  },

  async getAttributesFromVariations(variations = []) {
    variations = variations.filter(variation => !variation.name && !variation.value);
    if (!variations.length) return [];
    const query = { $and: variations.map(variation => ({ variation: { $elemMatch: variation } }))};

    return repository.productAttributes.getAll(query);
  },

  async exchangeOnSupportedCurrencies(price) {
    const currencies = CurrencyFactory.getCurrencies();

    const exchangePromises = currencies.map(async (currency) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({
        currencyAmount: price.amount, currency: price.currency,
      });
  
      if (price.currency === currency) {
        return { amount: amountOfMoney.getCentsAmount(), currency };
      }
  
      return CurrencyService.exchange(amountOfMoney, currency)
        .then((money) => ({ amount: money.getCentsAmount(), currency }));
    });
  
    return Promise.all(exchangePromises);
  },

  async convertToUSD(price) {
    const amountOfMoney = CurrencyFactory.getAmountOfMoney({ currencyAmount: price.amount, currency: price.currency });
    if (price.currency && price.currency !== "USD") {
      return CurrencyService.exchange(amountOfMoney, "USD");
    }
    return amountOfMoney;
  },

  async productInLivestream() {
    return repository.liveStream.getAll({"productDurations.0": {"$exists": true}})
    .then(livestreams => (livestreams.map(livestream => (livestream.productDurations.map(item => item.product)))))
    .then(arrays => [].concat(...arrays))
    .then(productIds => productIds.filter((v, i, a) => a.indexOf(v) === i))
  },

  async familyCategories(categoryIds) {
    const categories = await repository.productCategory.findByIds(categoryIds);
    const parentIds = categories.reduce((acc, category) => acc = acc.concat([...category.siblings, category.id]), []);
  
    return repository.productCategory.load({ parent: {$in: parentIds } }, {})
      .then(async children => {
        const childIds = children.reduce((acc, child) => acc.concat([...child.siblings, child.id]), [])
          .filter((id, i, self) => self.indexOf(id) === i);
        if (childIds.length === 0) {
          return parentIds;
        } else {
          return parentIds.concat(await this.familyCategories(childIds, repository));
        }
      })
  },

  async composeProductFilter(filter, user = null) {
    if (user) {
      filter.blackList = user.blackList;
    }
      
    if (filter.categories) {
      // get categories by id and slug
      const categories = await repository.productCategory.getAll({ $or: [
        { _id: {$in: filter.categories }}, 
        { slug: { $in: filter.categories }}
      ] });
      filter.categories = await this.familyCategories(categories.map(it => it.id))
      // await repository.productCategory.getUnderParents(categories.map(item => item._id))
      //   .then(categories => {
      //     filter.categories = categories.map(item => item.id);
      //   })
    }

    if (filter.price) {
      if (filter.price.min) {
        // const minPrices = await this.exchangeOnSupportedCurrencies(filter.price.min);
        // const [minInUSD] = minPrices.filter(el => el.currency === 'USD');
        // filter.price.min = minPrices;

        const amount = await this.convertToUSD(filter.price.min);
        const cent = amount.getCentsAmount();
        filter.price.min1 = { amount: cent, currency: amount.getCurrency() };
      }

      if (filter.price.max) {
        // const maxPrices = await this.exchangeOnSupportedCurrencies(filter.price.max);
        // const maxInUSD = maxPrices.filter(el => el.currency === 'USD');
        // filter.price.max = maxPrices;
        // filter.price.max1 = maxInUSD;

        const amount = await this.convertToUSD(filter.price.max);
        const cent = amount.getCentsAmount();
        filter.price.max1 = { amount: cent, currency: amount.getCurrency() };
      }
    }

    if (filter.hasLivestream) {
      const productIds = await this.productInLivestream(repository);
      filter.ids = productIds;
    }

    if (filter.variations) {
      const attributes = await this.getAttributesFromVariations(filter.variations);
      filter.attributes = attributes;
    }

    if (filter.brandNames && filter.brandNames.length) {
      const query = { $or: filter.brandNames.map((name) => ({ name: { $regex: `^${name}`, $options: 'i' } })) };
      const brands = await repository.brand.getAll(query);
      filter.brands = filter.brands.concat(brands.map(((it) => it.id)));
    }

    return filter;
  },

  async setProductQuantityFromAttributes(productId) {
    return repository.product.getById(productId)
      .then(product => {
        if (!product.attrs || !product.attrs.length) return product;

        return repository.productAttributes.getByIds(product.attrs)
          .then(attributes => {
            product.quantity = attributes.reduce((sum, item) => sum + item.quantity, 0);
            return product.save();
          })
      })
  },

  async processInventoryLogOnDeleteProduct(productId) {
    return repository.product.getById(productId)
      .then(async product => {
        let inventoryLogs = [{
          _id: uuid(),
          product: productId,
          productAttribute: null,
          type: InventoryLogType.USER_ACTION,
          shift: -product.quantity,
        }];

        const attributes = await repository.productAttributes.getByIds(product.attrs);

        if (attributes && attributes.length > 0) {
          inventoryLogs = inventoryLogs.concat(attributes.map(attribute => ({
            _id: uuid(),
            product: productId,
            productAttribute: attribute.id,
            type: InventoryLogType.USER_ACTION,
            shift: -attribute.quantity,
          })));
        }
        return Promise.all(inventoryLogs.map(inventoryLog => repository.productInventoryLog.add(inventoryLog)));
      })
  },

  async checkProductQuantityAvailable({ product, quantity, productAttribute = null }, repository) {
    const available = productAttribute ? await repository.productAttributes.checkAmountByAttr(productAttribute, quantity) :
        await repository.product.checkAmount(product, quantity);
    return available;
  },

  /**
   * @description decrease the product amount
   *   - qty of product & product attribute: should be the sum of history in product inventory log.
   *   - inventory log: logs when admin adds & updates product, and its attributes. and when buyers buy & refund products.
   *   - product.quatity & productAttributes.quantity: represents the current status.
   *   - inventory.shift: represents the change quantity due to add, update, buy, refund.
   */
  async decreaseProductQuantity({ product: productId, quantity, productAttribute: productAttrId = null, logType = InventoryLogType.BUYER_CART }, repository) {
    return (productAttrId ? repository.productAttributes.getById(productAttrId) : repository.product.getById(productId))
      .then(target => {
        target.quantity -= quantity;

        const inventoryLog = {
          _id: uuid(),
          product: productId,
          productAttribute: productAttrId,
          shift: -quantity,
          type: logType,
        };

        return Promise.all([
          target.save(),
          repository.productInventoryLog.add(inventoryLog),
        ]);
      })
  },

  async productSoldout({product: productId, quantity, productAttribute}, repository) {
    // to-do: 
    // - increase the product.sold
    // - call decreaseProductQuantity?
    return repository.product.getById(productId)
      .then(product => {
        product.sold += quantity;
        return product.save();
      })
  },
  async updateProductCountInCategories(ids) {
    if (typeof ids !== 'object' || ids.length === 0) return null;
    return repository.productCategory.findByIds(ids)
      .then(categories => {
        const idsToUpdate = categories.reduce((acc, category) => acc.concat([...category.parents, category.id]), []).filter(id => id);
        return Promise.all(idsToUpdate.map(categoryId => this.updateProductCountInCategory(categoryId)));
      })
  },
  async updateProductCountInCategory(id) {
    return Promise.all([
      repository.productCategory.getById(id),
      repository.productCategory.getUnderParent(id),
    ])
      .then(([category, children]) => {
        if (category) {
          const categories = [category.id, ...(children.map(subCate => subCate.id))];
          return repository.product.getTotal({ categories })
            .then(count => {
              category.nProducts = count;
              return category.save();
            })
        } else {
          return null;
        }
      })
  },
  async updateProductCountInBrand(id) {
    if (!id) return null;
    return Promise.all([
      repository.brand.getById(id),
      repository.product.getTotal({ brands: [id] }),
    ])
      .then(([brand, count]) => {
        if (brand) {
          brand.nProducts = count;
          return brand.save();
        } else {
          return null;
        }
      })
  },
}