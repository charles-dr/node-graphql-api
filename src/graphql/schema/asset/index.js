const { gql } = require('apollo-server');
const path = require('path');
const { GraphQLUpload } = require('apollo-upload-server');

const addAsset = require('./resolvers/addAsset');
const addAssetUrl = require('./resolvers/addAssetUrl');
const uploadAsset = require('./resolvers/uploadassets');
const uploadCsv = require('./resolvers/uploadCsv');
const uploadAssetForAdmin = require('./resolvers/uploadAssetForAdmin');
const uploadCsvForAdmin = require('./resolvers/uploadCsvForAdmin');
const asset = require('./resolvers/asset');
const assets = require('./resolvers/assets');
const assetCsvByStatus = require('./resolvers/assetCsvByStatus');
const resizeImages = require('./resolvers/resizeImages');
const uploadPreviewVideo = require('./resolvers/uploadPreviewVideo');
const { aws, logs } = require(path.resolve('config'));
const { SourceType, VideoCropMode } = require(path.resolve('src/lib/Enums'));

const schema = gql`
    enum AssetStatusEnum {
      UPLOADING
      UPLOADED
      FAILED
      CANCELED
    }

    """This type based on the MIME type of the file"""
    enum AssetTypeEnum {
      IMAGE
      VIDEO
      PDF
      CSV
    }

    enum VideoCropMode {
      ${VideoCropMode.toGQL()}
    }

    type Sign{  
      key: String,
      secret: String,
      region: String,
      bucket: String
    }
    scalar Upload

    type Asset {
      id: ID!
      """The path in the Storage. Path defined from root of the Storage"""
      path: String!
      """Public CDN URL"""
      url: String!
      status: AssetStatusEnum!
      type: AssetTypeEnum!
      """Size of asset in bytes"""
      size: Int!
      filename: String
      """Public CDN URL FOR THUMBNAIL"""
      thumbnail: String  
    }

    input AssetInputUrl{
      path:String!
      """It should be a MIME type of the file"""
      mimetype: String!
      filename: String
    }

    input AssetInput {
      """It should be a MIME type of the file"""
      mimetype: String!
      """Size of asset in bytes"""
      size: Int!
    }

    type AssetCollection {
        collection: [Asset]!
        pager: Pager
    }

    input AssetFilterInput {
      type: AssetTypeEnum
    }

    enum AssetSortFeature {
      CREATED_AT
      SIZE
    }

    input AssetSortInput {
      feature: AssetSortFeature! = CREATED_AT
      type: SortTypeEnum! = ASC
    }

    extend type Query {
      asset(id: ID!): Asset!
      assetCsvByStatus(status: AssetStatusEnum!): [Asset]! @auth(requires: USER)
      assets(
        filter: AssetFilterInput, 
        sort: AssetSortInput, 
        page: PageInput = {}): AssetCollection! @auth(requires: USER)
    }

    type File {
      id: ID!
      path: String!
      filename: String!
      mimetype: String!
      encoding: String!
    }

    input File64Input {
      base64: String!
      type: String!
    }

    extend type Mutation {
      """
      Allows: authorized user
      Asset is a file. It can be an Image, Video or PDF file. So any file.
      When you need upload assets you should go through next steps:
      1. use this entrypoint and register the asset what you going to upload
      2. in the response you will get a 'path'. This path you should use for upload file on Storage
      3. (in background) when file will be uploaded the Storage informs the API about that automaticaly, and status will be changed
      """
      addAsset (data: AssetInput!): Asset! @auth(requires: USER)

      giveSignedUrl: Sign! @auth(requires: USER)

      addAssetUrl(data:AssetInputUrl):Asset! @auth(requires:USER)

      uploadAsset(file:Upload!): Asset! @auth(requires: USER)

      uploadCsv(file:Upload!): Asset! @auth(requires: USER)
      uploadAssetForAdmin(file:Upload!): Asset! @auth(requires: ADMIN)
      uploadCsvForAdmin(file:Upload!): Asset! @auth(requires: ADMIN)
      resizeImages(ids: [ID], width: Int!, height: Int): ImageResized @auth(requires: ADMIN)

      uploadPreviewVideo(assetId: ID!, file:File64Input!, cropMode: VideoCropMode!): Asset! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Upload: GraphQLUpload,
  Query: {
    asset,
    assetCsvByStatus,
    assets,
  },
  Mutation: {
    addAsset,
    giveSignedUrl: async () => ({
      key: aws.aws_api_key, secret: aws.aws_access_key, region: logs.awsRegion, bucket: aws.user_bucket,
    }),
    uploadAsset,
    uploadCsv,
    uploadAssetForAdmin,
    uploadCsvForAdmin,
    addAssetUrl,
    resizeImages,
    uploadPreviewVideo
  },
};
