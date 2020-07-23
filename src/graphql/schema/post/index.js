const path = require('path');
const { gql } = require('apollo-server');

const addPost = require('./resolvers/addPost');
const updatePost = require('./resolvers/updatePost');
const deletePost = require('./resolvers/deletePost');
const posts = require('./resolvers/posts');
const postAdded = require('./resolvers/postAdded');
const postUpdated = require('./resolvers/postUpdated');

const schema = gql`
  type Post {
    id: ID!
    title: String
    feed: String!
    user: User!
    tags: [String]
    assets: [Asset]
    streams: [LiveStream]
  }

  input PostAddInput {
    title: String
    feed: String!
    tags: [String] = []
    assets: [ID] = []
    streams: [ID] = []
  }

  input PostUpdateInput {
    title: String
    feed: String
    tags: [String]
    assets: [ID]
    streams: [ID]
  }

  input PostFilterInput {
    searchQuery: String
    author: ID
    hasLiveStream: Boolean
  }

  enum PostSortFeature {
    CREATED_AT
  }

  input PostSortInput {
    feature: PostSortFeature! = CREATED_AT
    type: SortTypeEnum! = DESC
  }

  type PostCollection {
    collection: [Post]!
    pager: Pager
  }

  extend type Query {
    post(id: ID!): Post
    posts(
      filter: PostFilterInput = {},
      sort: PostSortInput = {},
      page: PageInput = {}
    ): PostCollection @auth(requires: USER)
  }

  extend type Mutation {
    addPost(data: PostAddInput!): Post @auth(requires: USER)
    updatePost(id: ID!, data: PostUpdateInput!): Post @auth(requires: USER)
    deletePost(id: ID!): Boolean @auth(requires: USER)
  }

  extend type Subscription {
    postAdded: Post! @auth(requires: USER)
    postUpdated: Post! @auth(requires: USER)
  }

`

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    post: async (_, { id }, { dataSources: { repository } }) => repository.post.getById(id),
    posts,
  },
  Mutation: {
    addPost,
    updatePost,
    deletePost,
  },
  Subscription: {
    postAdded,
    postUpdated
  },
  Post: {
    user: async ({ user }, __, { dataSources: { repository }}) => repository.user.getById(user),
    assets: async ({ assets }, __, { dataSources: { repository }}) => repository.asset.getByIds(assets),
    streams: async ({ streams }, __, { dataSources: { repository }}) => repository.liveStream.getByIds(streams),
  },
}


