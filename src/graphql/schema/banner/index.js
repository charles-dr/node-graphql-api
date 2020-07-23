const { gql } = require("apollo-server");
const path = require("path");

const { BannerAdType, BannerLayoutType, BannerType } = require(path.resolve("src/lib/Enums"));

const banner = require("./resolvers/banner");
const banners = require("./resolvers/banners");
const addBanner = require("./resolvers/addBanner");
const updateBanner = require('./resolvers/updateBanner');
const uploadBulkBanners = require('./resolvers/uploadBulkBanners');

const schema = gql`

    enum BannerAdType {
      ${BannerAdType.toGQL()}
    }

    enum BannerLayoutType {
      ${BannerLayoutType.toGQL()}
    }

    enum BannerType {
      ${BannerType.toGQL()}
    }

    enum BannerSortFeature {
      CREATED_AT
      NAME
    }

    type BannerSize {
      width: Int!
      height: Int!
    }

    input BannerSizeInput {
      width: Int!
      height: Int!
    }

    type BannerAsset {
      image: String!
      image4Mobile: String
      link: String
    }

    input BannerAssetInput {
      image: String!
      image4Mobile: String
      link: String
    }

    type Banner {
      id: ID!
      identifier: String!
      """
        Unique name for each banner.
      """
      name: String!
      """
        Path in site routing.
      """
      page: String
      sitePath: String!
      """
        Array of pair of image and link. image is required, but link is optional.
      """
      assets: [BannerAsset]!
      adType: BannerAdType!
      type: BannerType!
      layout: BannerLayoutType!
      """
        Dimensions of asset or layout.
      """
      size: BannerSize
      """
        Interval for layouts of "carousel","floating", "rotating". unit in seconds
      """
      time: Int
    }

    input BannerInput{
      identifier: String!
      name: String!
      page: String
      sitePath: String!
      assets: [BannerAssetInput]!
      adType: BannerAdType!
      type: BannerType!
      layout: BannerLayoutType!
      size: BannerSizeInput!
      time: Int
    }

    input BannerUpdateInput {
      name: String
      page: String
      sitePath: String
      assets: [BannerAssetInput]
      adType: BannerAdType
      type: BannerType
      layout: BannerLayoutType
      size: BannerSizeInput
      time: Int
    }

    type BannerCollection {
        collection: [Banner]!
        pager: Pager
    }

    input BannerFilterInput {
      searchQuery: String
      sitePath: String
      type: BannerType
      adType: BannerAdType
      layout: BannerLayoutType
      identifiers: [String!]
    }

    input BannerSortInput {
      feature: BannerSortFeature! = CREATED_AT
      type: SortTypeEnum! = ASC
    }

    type FailedBanners{
      row: [Int!]
      errors: [String!]
    }

    type UploadedBanners {
      total: Int!
      success: Int!
      failed: Int!
      failedList: FailedBanners!
    }

    extend type Query {
      banner(id: ID!): Banner!
      bannerByIdentifier(identifier: String!): Banner!
      banners(
        filter: BannerFilterInput = {},
        sort: BannerSortInput = {}, 
        page: PageInput = {}): BannerCollection!
    }

    extend type Mutation {
      addBanner (data: BannerInput!): Banner! @auth(requires: ADMIN)
      updateBanner(id: ID!, data: BannerUpdateInput!): Banner! @auth(requires: ADMIN)
      uploadBulkBanners(file: Upload!): UploadedBanners @auth(requires: ADMIN)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    banner,
    bannerByIdentifier: async (_, { identifier }, { dataSources: { repository }}) => {
      return repository.banner.getOne({ identifier });
    },
    banners,
  },
  Mutation: {
    addBanner,
    updateBanner,
    uploadBulkBanners,
  },
};
