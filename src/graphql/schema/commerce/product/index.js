const path = require('path');

const { gql } = require('apollo-server');

const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { ProductMetricUnits } = require(path.resolve('src/lib/Enums'));
const addProduct = require('./resolvers/addProduct');
const updateProduct = require('./resolvers/updateProduct');
const deleteProduct = require('./resolvers/deleteProduct');
const removeDuplicatedProduct = require('./resolvers/removeDuplicatedProduct');
const updateProductForAdmin = require('./resolvers/updateProductForAdmin');
const deleteProductForAdmin = require('./resolvers/deleteProductForAdmin');
const setProductThumbnail = require('./resolvers/setProductThumbnail');
const products = require('./resolvers/products');
const uploadBulkProducts = require('./resolvers/uploadBulkProducts');
const previewBulkProducts = require('./resolvers/previewBulkProducts');
const addProductAttr = require('./resolvers/addProductAttr');
const productAttributes = require('./resolvers/productAttributes');
const updateProductAttr = require('./resolvers/updateProductAttr');
const deleteProductAttr = require('./resolvers/deleteProductAttr');
const productsByTheme = require('./resolvers/productsByTheme');
const uploadBulkProductHashtags = require('./resolvers/uploadBulkProductHashtags');
const correctProductInventoryLog = require('./resolvers/correctProductInventoryLog');
const updateProductHashtags = require('./resolvers/updateProductHashtags');
const popularProducts = require('./resolvers/productPage/popularProducts');
const recommendProducts = require('./resolvers/productPage/recommendProducts');


const schema = gql`
  enum ProductMetricUnit {
    ${ProductMetricUnits.toGQL()}
  }

  type ProductAttribute {
    id: ID!
    productId: ID!
    """
        Price in cents. Use the Currency for show it in correct format
    """
    price(currency: Currency): AmountOfMoney!
    oldPrice(currency: Currency): AmountOfMoney
    quantity: Int!
    variation(language: LanguageList): [Variation]
    asset: Asset
    sku: String
  }

  type Variation {
    name: String!
    value: String!
  }

  type RateStats {
    average: Float!
    total: Int!
  }

  type Product {
    id: ID!
    """
        The User who is product owner
    """
    seller: User!
    title(language: LanguageList): String
    description(language: LanguageList): String
    descriptionImages: [String]
    """
        Price in cents. Use the Currency for show it in correct format
    """
    price(currency: Currency): AmountOfMoney!
    """
        Price in cents. Use the Currency for show it in correct format
    """
    oldPrice(currency: Currency): AmountOfMoney
    quantity: Int!
    assets: [Asset!]!
    thumbnail: Asset
    attrs: [ProductAttribute]
    category: ProductCategory
    # weight: Weight!
    shippingBox: ShippingBox!
    brand: Brand
    relatedLiveStreams(limit: Int = 1): [LiveStream]!
    freeDeliveryTo: [MarketType!]
    rating: RateStats!
    customCarrier: CustomCarrier
    customCarrierValue(currency: Currency):AmountOfMoney
    metrics: [ProductMetricItem]
    wholesaleEnabled: Boolean
    sku: String
    isFeatured: Boolean
    slug: String
    metaDescription: String
    metaTags: [String]
    seoTitle: String
    sold: Int
    hashtags: [String]
  }

  type failedProducts{
    row: [Int!]
    errors: [String!]
  }

  type UploadedProducts{
    success: [Product]
    failedProducts: failedProducts!
    totalProducts: Int!
    uploaded: Int!
    failed: Int!
  }

  type ProductMetricItem {
    metricUnit: ProductMetricUnit!
    minCount: Int
    unitPrice(currency: Currency): AmountOfMoney!
    quantity: Int!
  }

  type Weight {
    value: Float!
    unit: WeightUnitSystem!
  }

  input WeightInput {
    value: Float!
    unit: WeightUnitSystem!
  }

  type ProductCollection {
    collection: [Product]!
    pager: Pager
  }

  input ProductFilterInput {
    """
        Searching by Title and Description of the Product.
        Will return products if the query full matched inside title or description
    """
    searchQuery: String
    # todo need implement filtering by quantity
    # quantity: IntRangeInput = {min: 1}
    categories: [ID!]
    brands: [ID!] = []
    brandNames: [String!] = []
    """This price in currency (like 23.45)"""
    price: AmountOfMoneyRangeInput
    """
        You can use it for fetch products by specific Seller
    """
    sellers: [ID!]
    isWholeSale: Boolean
    isFeatured: Boolean
    hasLivestream: Boolean = false
    variations: [VariationInput]
    ids: [ID!]
  }

  input ProductAttributeInput {
    productId: ID!
    quantity: Int!
    price: Float!
    oldPrice: Float
    currency: Currency!
    asset: ID!
    variation: [VariationInput!]!
    sku: String
  }

  """WO = WithOut"""
  input ProductAttrWOProductInput {
    quantity: Int!
    price: Float!
    oldPrice: Float
    currency: Currency!
    variation: [VariationInput!]!
    asset: ID!
    sku: String
  }

  input VariationInput {
    name: String!
    value: String!
  }

  input UpdateProductAttributeInput {
    productId: ID!
    quantity: Int
    price: Float
    oldPrice: Float
    currency: Currency
    variation: [VariationInput!]
    asset: ID
  }

  enum ProductSortFeature {
    CREATED_AT
    PRICE
    SOLD
  }

  input ProductSortInput {
    feature: ProductSortFeature! = CREATED_AT
    type: SortTypeEnum! = ASC
  }

  type removedProducts {
    success: Boolean!
    removed: [ID!]
    reason: String
  }

  extend type Query {
    products(
        filter: ProductFilterInput = {},
        sort: ProductSortInput = {},
        page: PageInput = {}
    ): ProductCollection!
    product(id: ID!): Product
    previewBulkProducts(fileName:String!): String! @auth(requires: USER)
    productAttributes(productId: ID!): [ProductAttribute!]!
    productsByTheme(theme: ID!, sort: ProductSortInput = {}, page: PageInput = {}): ProductCollection!
    productBySlug(slug: String!): Product
    popularProducts(productId: ID!, limit: Int = 10): [Product!]
    recommendProducts(productId: ID!, limit: Int = 10): [Product!]
  }

  input ProductMetricItemInput {
    metricUnit: ProductMetricUnit!
    minCount: Int
    unitPrice: AmountOfMoneyInput!
    quantity: Int!
  }

  input ProductInput {
    title: String!
    description: String!
    """
        Price in dollars. Use the Currency for convert user input in cents
    """
    price: Float!
    """
        Price in dollars. Use the Currency for convert user input in cents
    """
    oldPrice: Float
    quantity: Int!
    """
        The Active User Currency
    """
    currency: Currency!
    assets: [ID!]!
    category: ID!
    # weight: WeightInput!
    shippingBox: ID!
    brand: ID!
    freeDeliveryTo: [MarketType!]
    customCarrier: String
    customCarrierValue: Float
    metrics: [ProductMetricItemInput]
    wholesaleEnabled: Boolean
    attrs: [ProductAttrWOProductInput!]
    thumbnailId:  ID!
    isFeatured: Boolean
    slug: String
    metaDescription: String!
    metaTags: [String]!
    seoTitle: String!
    hashtags: [String]
  }

  type ProductUpdateError {
    id: String!
    errors: [String]!
  }
  
  type ProductBulkUpdated {
    totalProducts: Int!
    processed: Int!
    success: Int!
    failure: Int!
    errors: [ProductUpdateError]!

  }

  extend type Mutation {
    """
        Allows: authorized user
    """
    addProduct(data: ProductInput!): Product! @auth(requires: USER)
    """
        Allows: authorized user & user must be a seller of this product
    """
    updateProduct(id: ID!, data: ProductInput!): Product! @auth(requires: USER)
    updateProductForAdmin(id: ID!, data: ProductInput!): Product! @auth(requires: ADMIN)
    """
        Allows: authorized user & user must be a seller of this product
    """
    deleteProduct(id: ID!): Boolean @auth(requires: USER)
    """
        Allows: authorized user
    """
    addProductAttr(data: ProductAttributeInput!): ProductAttribute! @auth(requires: USER)
    updateProductAttr(id: ID!, data: UpdateProductAttributeInput!): ProductAttribute! @auth(requires: USER)
    deleteProductAttr(id: ID!, productId: ID!): Boolean @auth(requires: USER)
    deleteProductForAdmin(id: ID!): Boolean @auth(requires: ADMIN)
    removeDuplicatedProduct(id: ID!): removedProducts @auth(requires: ADMIN)

    setProductThumbnail(id: ID!, assetId: ID!): Boolean!
    uploadBulkProducts(fileName:String!, bucket:String): UploadedProducts!
    uploadBulkProductHashtags(file: Upload!): UploadedProducts!
    correctProductInventoryLog(skip: Int!, limit: Int! = 500): ProductBulkUpdated @auth(requires: USER)
    updateProductHashtags(skip: Int!, limit: Int = 500): ProductBulkUpdated @auth(requires: USER)
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    products,
    product: async (_, { id }, { dataSources: { repository } }) => repository.product.getById(id),
    previewBulkProducts,
    productAttributes: async (_, { productId }, { dataSources: { repository } }) => repository.productAttributes.getByProduct(productId),
    productsByTheme,
    productBySlug: async (_, { slug }, { dataSources: { repository }}) => repository.product.getBySlug(slug),
    popularProducts,
    recommendProducts,
  },
  Mutation: {
    addProduct,
    updateProduct,
    deleteProduct,
    removeDuplicatedProduct,
    updateProductForAdmin,
    deleteProductForAdmin,
    setProductThumbnail,
    uploadBulkProducts,
    addProductAttr,
    updateProductAttr,
    deleteProductAttr,
    uploadBulkProductHashtags,
    correctProductInventoryLog,
    updateProductHashtags,
  },
  Product: {
    seller: async ({ seller }, _, { dataSources: { repository } }) => (
      repository.user.load(seller)
    ),
    assets: async ({ assets }, _, { dataSources: { repository } }) => (
      repository.asset.getByIds(assets)
    ),
    thumbnail: async ({ thumbnail: assetId }, _, { dataSources: { repository } }) => (
      repository.asset.getById(assetId)
    ),
    category: async ({ category }, _, { dataSources: { repository } }) => (
      repository.productCategory.getById(category)
    ),
    brand: async ({ brand }, _, { dataSources: { repository } }) => (
      repository.brand.getById(brand)
    ),
    quantity: async ({ id }, _, { dataSources: { repository } }) => (
      repository.productInventoryLog.getQuantityByProductId(id)
    ),
    shippingBox: async ({ shippingBox }, _, { dataSources: { repository } }) => (
      repository.shippingBox.findOne(shippingBox)
    ),
    customCarrierValue: async ({ customCarrierValue, currency }, args) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: customCarrierValue, currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
    price: async ({ price, currency }, args) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: price, currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
    oldPrice: async ({ oldPrice, currency }, args) => {
      if (!oldPrice) {
        return null;
      }

      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: oldPrice, currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
    relatedLiveStreams: async ({ id }, { limit }, { dataSources: { repository } }) => repository.liveStream.get({
      filter: {
        experiences: [],
        categories: [],
        cities: [],
        statuses: [],
        streamers: [],
        product: id,
      },
      page: { limit, skip: 0 },
      sort: { feature: 'CREATED_AT', type: 'DESC' },
    }),
    rating: async (product, _, { dataSources: { repository } }) => ({
      average: repository.rating.getAverage(product.getTagName()),
      total: repository.rating.getTotal({ tag: product.getTagName() }),
    }),
    customCarrier: async ({ customCarrier }, _, { dataSources: { repository } }) => repository.customCarrier.getById(customCarrier),
    // attributes of product
    attrs: async ({ attrs }, _, { dataSources: { repository } }) => {
      const attributes = await repository.productAttributes.getByIds(attrs);
      await Promise.all(attributes.map(async (attr, index) => {
        attributes[index].asset = await repository.asset.getById(attr.asset);
      }));
      return attributes;
    },
    title: async ({ id, title }, { language }, { dataSources: { repository } }) => {
      if (!language) return title;
      return repository.productTranslation.getByProduct(id)
        .then((translation) => (translation && translation.title[language.toLowerCase()] ? translation.title[language.toLowerCase()] : title));
    },
    description: async ({ id, description }, { language }, { dataSources: { repository } }) => {
      if (!language) return description;
      return repository.productTranslation.getByProduct(id)
        .then((translation) => translation.description[language.toLowerCase()])
        .catch(error => description);
    },
    sold: ({ sold }) => Number(sold) > 0 ? Number(sold) : 0,
  },
  ProductAttribute: {
    asset: async ({ asset }, _, { dataSources: { repository } }) => (
      repository.asset.getById(asset)
    ),
    price: async ({ price, currency }, args) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: price, currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
    oldPrice: async ({ oldPrice, currency, price }, args) => {
      if (!oldPrice) {
        oldPrice = price;
      }
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: oldPrice, currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
    quantity: async ({ quantity }) => (typeof quantity === 'number' ? Math.floor(quantity) : 0),
    variation: async ({ id, variation }, { language }, { dataSources: { repository } }) => {
      if (!language) return variation;
      return repository.variationTranslation.getByAttribute(id)
        .then(variationTranslation => variationTranslation.variations.map(({ name, value }) => ({ name, value: value[language.toLowerCase()] })))
        .catch(() => variation);
    },
  },
  ProductMetricItem: {
    unitPrice: async ({ unitPrice }, args, { dataSources: {repository} }) => {
      let amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: unitPrice.amount, currency: unitPrice.currency });
      if (args.currency && args.currency !== unitPrice.currency) {
        amountOfMoney = CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    }
  },
};
