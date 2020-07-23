const path = require('path');
const { gql } = require('apollo-server');

const { RatingTarget } = require(path.resolve('src/lib/Enums'));

const rateProduct = require('./resolvers/rateProduct');
const rateOrganization = require('./resolvers/rateOrganization');
const rateProductByOrder = require('./resolvers/rateProductByOrder');
const rateUser = require('./resolvers/rateUser');
const reviews = require('./resolvers/reviews');
const uploadBulkReviews = require('./resolvers/uploadBulkReviews');
const updateReview = require('./resolvers/updateReview');
const deleteReview = require('./resolvers/deleteReview');

const schema = gql`
    enum RatingTargetType {
      ${ RatingTarget.toGQL() }
    }

    union RatingTarget = Product | Organization | User
    type Media{
        id: String
        url: String
    }
    type Review {
      id: ID!
      target: RatingTarget!
      tag: String!
      rating: Float!
      message: String
      media:[Media]
      user: User!
      order: OrderProductItem
      language: LanguageDetails
    }

    input RatingOrderInput {
      message: String
      order: ID!
      product: ID!
      rating: Float!
    }

    input RatingUserInput {
      message: String
      user: ID!
      rating: Float!
    }

    input UpdateReviewInput {
      message: String
      rating: Float
    }

    """
    - For a product, either of type & target or tag can be specified. Recommended to filter using type and target.
    """
    input ReviewFilterInput {
      type: RatingTargetType = PRODUCT
      target: ID
      tag: String
      user: ID
      order: ID
      language: LanguageList
    }

    enum ReviewSortFeature {
      CREATED_AT
    }

    input ReviewSortInput {
      feature: ReviewSortFeature! = CREATED_AT
      type: SortTypeEnum! = DESC
    }

    type ReviewCollection {
      collection: [Review]!
      pager: Pager
    }

    type FailedReviews{
      row: [Int!]
      errors: [String!]
    }

    type UploadedReviews {
      total: Int!
      success: Int!
      failed: Int!
      failedList: FailedReviews!
    }


    extend type Query {
      review(id: ID!): Review
      reviews(filter: ReviewFilterInput = {}, sort: ReviewSortInput = {}, page: PageInput = {}): ReviewCollection!
    }

    extend type Mutation {
        """
          - Allows: authorized user.
          - @deprecated: Use "rateProductByOrder" instead.
        """
        rateProduct(product: ID!, rating: Float!, message: String, media: [String]): Review! @auth(requires: USER) @deprecated(reason: "use 'rateProductByOrder' instead")
        
        """Allows: authorized user"""
        rateOrganization(organization: ID!, rating: Int!, message: String): Boolean! @auth(requires: USER)
        
        """Allows: authorized user"""
        rateProductByOrder(data: RatingOrderInput): Review @auth(requires: USER)
        uploadBulkReviews(file: Upload!): UploadedReviews @auth(requires: USER)
        updateReview(id: ID!, data: UpdateReviewInput): Review @auth(requires: USER)
        deleteReview(id: ID!): Boolean! @auth(requires: USER)
        rateUser(data: RatingUserInput): Review @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    review: async (_, { id }, { dataSources: { repository }}) => repository.rating.getById(id),
    reviews,
  },
  Mutation: {
    rateProduct,
    rateProductByOrder,
    rateUser,
    rateOrganization,
    uploadBulkReviews,
    updateReview,
    deleteReview,
  },
  Review: {
    target: async ({ tag }, _, { dataSources: { repository }}) => {
      const targetType = function(str) { return str.charAt(0).toLowerCase() + str.slice(1); }(tag.split(':')[0]);
      const targetId = tag.split(':')[1];
      return repository[targetType].getById(targetId);
    },
    rating: ({ rating }) => rating.toFixed(1),
    order: async ({ order }, _, { dataSources: { repository }}) => {
      return order ? repository.orderItem.getById(order) : null;
    },
    user: async ({ user }, _, { dataSources: { repository }}) => repository.user.getById(user),
    language: async ({ lang }, _, { dataSources: { repository }}) => repository.language.getById(lang),
  },
  RatingTarget: {
    __resolveType(ratingTarget) {
      if (ratingTarget.price) {
        return 'Product';
      } else if (ratingTarget.email) {
        return 'User';
      } else if (ratingTarget.owner) {
        return 'Organization';
      } else {
        return null;
      }
    }
  },
};
