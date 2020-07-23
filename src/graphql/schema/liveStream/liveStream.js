const path = require('path');
const { gql, withFilter } = require('apollo-server');

const { OrientationMode, SubscriptionType, VideoTag } = require(path.resolve('src/lib/Enums'));

const addLiveStream = require('./resolvers/addLiveStream');
const addLiveStreamForAdmin = require('./resolvers/addLiveStreamForAdmin');
const likeLiveStream = require('./resolvers/likeLiveStream');
const archiveLiveStream = require('./resolvers/archiveLiveStream');
const joinLiveStream = require('./resolvers/joinLiveStream');
const leaveLiveStream = require('./resolvers/leaveLiveStream');
const getLiveStreamCollection = require('./resolvers/getLiveStreamCollection');
const getLiveStreamDuration = require('./resolvers/getLiveStreamDuration');
const addProductToLiveStream = require('./resolvers/addProductToLiveStream');
const removeProductFromLiveStream = require('./resolvers/removeProductFromLiveStream');
const updateLiveStreamCount = require('./resolvers/updateLiveStreamCount');
const updateLiveStreamPreviewVideo = require('./resolvers/updateLiveStreamPreviewVideo');
const updateLiveStreamThumbnail = require('./resolvers/updateLiveStreamThumbnail');
const addStreamRecord = require('./resolvers/addStreamRecord');
const toggleStatusLiveStream = require('./resolvers/toggleStatusLiveStream');
const updateStreamRecord = require('./resolvers/updateStreamRecord');
const previousQueue = require('./resolvers/previousQueue');
const nextQueue = require('./resolvers/nextQueue');
const updateLiveStreamProducts = require('./resolvers/updateLiveStreamProducts');
const updateLiveStreamSlug = require('./resolvers/updateLiveStreamSlug');
const hideLiveStream = require('./resolvers/hideLiveStream');
const liveStreamLiked = require('./resolvers/liveStreamLiked');

const pubsub = require(path.resolve('config/pubsub'));

const schema = gql`
  enum OrientationMode {
    ${OrientationMode.toGQL()}
  }

  enum VideoTag {
    ${VideoTag.toGQL()}
  }

  type LiveStreamStats {
    duration: Int
    likes: Int
    viewers: Int
  }

  type LiveStreamAddress {
    wsurl: String!
    fileurl:String!
    abs_url:String!
  }

  type StreamProductDuration {
    product: Product
    duration: String
  }

  input StreamProductDurationInput {
    product: String!
    """
      Associated time with the video. for example: "00:35-00:55"
    """
    duration: String!
  }

  type LiveStream {
    id: ID!
    title(language: LanguageList): String!
    streamer: User!
    experience: LiveStreamExperience!
    categories: [LiveStreamCategory]!
    city: String
    preview: [Asset]
    previewVideo: Asset
    channel: StreamChannel!
    isLiked: Boolean
    statistics: LiveStreamStats!
    publicMessageThread: MessageThread
    privateMessageThreads: [MessageThread]!
    # products: [Product]! @deprecated(reason: "Use 'productDurations' instead")
    views: Int!
    likes: Int!
    startTime: Date
    productDurations: [StreamProductDuration]
    orientation: OrientationMode!
    thumbnail: Asset
    isFeatured: Boolean
    hashtags: [String]
    videoTags: [String]
    slug: String
  }

  input LiveStreamInput {
    title: String!
    experience: ID!
    categories: [ID]! = []
    city: String
    preview: [ID] = []
    previewVideo: ID
    # products: [ID] = [] 
    liveStreamRecord: [String] = []
    startTime: Date
    productDurations: [StreamProductDurationInput] = []
    orientation: OrientationMode!
    thumbnail: ID!
    hashtags: [String] = []
  }

  input AdminLiveStreamInput {
    title: String!
    experience: ID!
    categories: [ID]!
    city: String
    preview: ID
    products: [ID] = [],
    liveStreamRecord:[String],
    user: ID!
  }

  type LiveStreamCollection {
    collection: [LiveStream]!
    pager: Pager
  }

  input LiveStreamFilterInput {
    """
    Searching by Title of the Live Stream.
    Will return live streams if the query full matched inside title
    """
    searchQuery: String
    experiences: [ID] = []
    categories: [ID] = []
    cities: [ID] = []
    statuses: [StreamChannelStatus] = []
    """
    You can use it for fetch live streams by specific Streamer
    """
    streamers: [ID!] = []
    isFeatured: Boolean = null
    productFilter: ProductFilterInput
    videoTags: [VideoTag] = []
  }

  enum LiveStreamSortFeature {
    CREATED_AT
  }

  input LiveStreamSortInput {
    feature: LiveStreamSortFeature! = CREATED_AT
    type: SortTypeEnum! = ASC
  }

  enum LikeLiveStreamViewType {
    view like
  }

  enum LikeLiveStreamTagType {
    real fake
  }

  input LiveStreamUpdateInput {
    id: ID!
    playLength: Int!
    view: LikeLiveStreamViewType!
    tag: LikeLiveStreamTagType!
  }

  type VideoQueueResponse {
    record: StreamRecordSource
    liveStream: LiveStream
  }

  type LikeStreamNotification {
    liveStream: LiveStream!
    user: User!
    isLiked: Boolean
  }

  extend type Query {
    liveStreams(filter: LiveStreamFilterInput = {}, page: PageInput = {}, sort: LiveStreamSortInput = {}): LiveStreamCollection!
    liveStream(id: ID): LiveStream
    liveStreamBySlug(slug: String!): LiveStream
    liveStreamAddress(id:ID!): LiveStreamAddress
    previousLiveStream(id: ID!): LiveStream
    nextLiveStream(id: ID!): LiveStream
    previousLiveStreamID(id: ID!): ID
    nextLiveStreamID(id: ID!): ID
    previousQueue(liveStream: ID!, currentRecord: ID!): VideoQueueResponse
    nextQueue(liveStream: ID!, currentRecord: ID!): VideoQueueResponse
  }

  extend type Mutation {
    """
    Allows: authorized user
    input field 'products' is deprecated on Nov 18, 2020 to set the duration for assosicated products.
    Use 'productDurations' instead.
    """
    addLiveStream(data: LiveStreamInput!): LiveStream! @auth(requires: USER)
    addLiveStreamForAdmin(data: AdminLiveStreamInput!): LiveStream! @auth(requires: ADMIN)

    """Allows: authorized user"""
    likeLiveStream(id: ID!): LiveStream! @auth(requires: USER)

    """Allows: authorized user"""
    archiveLiveStream(id: ID!): LiveStream! @auth(requires: USER)
    toggleStatusLiveStream(id: ID!, status: Boolean!): LiveStream!
    hideLiveStream(id: ID!, hide: Boolean!): LiveStream! @auth(requires: ADMIN)
    
    """
    Allows: authorized user
    When user join LiveStream next things executed:
    1. StreamChannel Token generation for this User and LiveStream
    2. Created MessageThread for User and Streamer
    Pass ID of the Live Stream
    """
    joinLiveStream(id: ID!): LiveStream! @auth(requires: USER)

    """
    Allows: authorized user
    Pass ID of the Live Stream
    """
    leaveLiveStream(id: ID!): Boolean! @auth(requires: USER)
    """
    Allows: authorized user
    Pass ID of the Live Stream and list of Product IDs. Make sure to set Error Policy to 'all'
    """
    addProductToLiveStream(liveStream: ID!, products: [StreamProductDurationInput]!): LiveStream! @auth(requires: USER)
    """
    Allows: authorized user
    Pass ID of the Live Stream and ID of the Product
    """
    removeProductFromLiveStream(liveStream: ID!, productId: ID!): LiveStream! @auth(requires: USER)
    updateLiveStreamCount(data: LiveStreamUpdateInput): LiveStream!
    updateLiveStreamPreviewVideo(id: ID!, assetId: ID!): LiveStream
    updateLiveStreamThumbnail(id: ID!, thumbnailId: ID!): LiveStream
    addStreamRecord(liveStream: ID!, streamRecord: String!): LiveStream
    updateStreamRecord(liveStream: ID!, streamRecord: [String]!): LiveStream!
    updateLiveStreamProducts(liveStream: ID!, productDurations: [StreamProductDurationInput]): LiveStream! @auth(requires: USER)
    """
    Allows: authorized admin
    """
    updateLiveStreamSlug: Boolean! @auth(requires: ADMIN) 
  }

  extend type Subscription {
    """Allows: authorized user"""
    liveStream(id: ID!): LiveStream @auth(requires: USER)
    liveStreamLiked(ids: [ID]): LikeStreamNotification @auth(requires: USER)
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    liveStream(_, { id }, { dataSources: { repository } }) {
      return repository.liveStream.load(id);
    },
    liveStreams: getLiveStreamCollection,
    liveStreamBySlug: (_, { slug }, { dataSources: { repository } }) => {
      return repository.liveStream.getOne({ slug });
    },
    liveStreamAddress(_, { id }, { dataSources: { repository } }) {
      return {
        wsurl:'ws://18.185.121.9:8188',
        fileurl:'https://recording.shoclef.com',
        abs_url:'/opt/janus/share/janus/recordings'
      };
    },
    previousLiveStream: (_, { id }, { dataSources: { repository }}) => repository.liveStream.getPreviousStream(id),
    nextLiveStream: (_, { id }, { dataSources: { repository }}) => repository.liveStream.getNextStream(id),
    previousLiveStreamID: (_, { id }, { dataSources: { repository }}) => {
      return repository.liveStream.getPreviousStream(id)
        .then(liveStream => liveStream ? liveStream._id : null)
    },
    nextLiveStreamID: (_, { id }, { dataSources: { repository }}) => {
      return repository.liveStream.getNextStream(id)
        .then(liveStream => liveStream ? liveStream._id : null)
    },
    previousQueue,
    nextQueue,
  },
  Mutation: {
    addLiveStream,
    addLiveStreamForAdmin,
    likeLiveStream,
    archiveLiveStream,
    joinLiveStream,
    leaveLiveStream,
    addProductToLiveStream,
    removeProductFromLiveStream,
    updateLiveStreamCount,
    updateLiveStreamPreviewVideo,
    updateLiveStreamThumbnail,
    addStreamRecord,
    toggleStatusLiveStream,
    hideLiveStream,
    updateStreamRecord,
    updateLiveStreamProducts,
    updateLiveStreamSlug,
  },
  Subscription: {
    liveStream: {
      resolve: (payload) => payload,
      subscribe: withFilter(
        () => pubsub.asyncIterator([SubscriptionType.LIVE_STREAM_CHANGE]),
        (payload, variables) => payload.id === variables.id,
      ),
    },
    liveStreamLiked,
  },
  LiveStream: {
    title: async ({ id, title }, { language }, { dataSources: { repository } }) => {
      if (!language) return title;
      return repository.liveStreamTranslation.getByLivestream(id)
        .then((translation) => (translation && translation.title[language.toLowerCase()] ? translation.title[language.toLowerCase()] : title));
    },
    experience(liveStream, args, { dataSources: { repository } }) {
      return repository.liveStreamExperience.getById(liveStream.experience);
    },
    categories(liveStream, args, { dataSources: { repository } }) {
      return liveStream.categories.map(
        (category) => repository.liveStreamCategory.getById(category),
      );
    },
    // city(liveStream, args, { dataSources: { repository } }) {
    //   return repository.city.load(liveStream.city);
    // },
    preview(liveStream, args, { dataSources: { repository } }) {
      return repository.asset.getByIds(typeof liveStream.preview === 'string' ? [liveStream.preview] : liveStream.preview);
    },
    previewVideo(liveStream, args, { dataSources: { repository } }) {
      return repository.asset.load(liveStream.previewVideo);
    },
    streamer(liveStream, args, { dataSources: { repository } }) {
      return repository.user.load(liveStream.streamer);
    },
    channel(liveStream, args, { dataSources: { repository } }) {
      return repository.streamChannel.load(liveStream.channel);
    },
    isLiked(liveStream, args, { user, dataSources: { repository } }) {
      if (!user) {
        return null;
      }
      return repository.like.load(`LiveStream:${liveStream.id}`, user.id).then((like) => !!like);
    },
    statistics(liveStream) {
      return liveStream;
    },
    /**
      Any user allows receive Public Thread
    */
    publicMessageThread(liveStream, _, { dataSources: { repository }, user }) {
      if (!user) {
        return null;
      }
      if (typeof liveStream.publicMessageThread === 'object') {
        return liveStream.publicMessageThread;
      }
      return repository.messageThread.findOne(liveStream.publicMessageThread);
    },
    /**
      User allows receive all private threads if he is a Streamer.
      Overwise User receive only private one thread with Streamer.
    */
    privateMessageThreads(liveStream, _, { dataSources: { repository }, user }) {
      if (!user) {
        return [];
      }
      if (user.id === liveStream.streamer) {
        return repository.messageThread.findByIds(liveStream.privateMessageThreads);
      }

      return repository.messageThread.findAllByIdsAndParticipants(
        liveStream.privateMessageThreads,
        // [user, liveStream.streamer],
        [user.id],
      )
        // .then((thread) => (!thread ? [] : [thread]));
    },
    // products(liveStream, _, { dataSources: { repository } }) {
    //   return repository.product.getByIds(liveStream.products);
    // },
    views(liveStream, _, { dataSources: { repository } }) {
      return repository.liveStream.getViews(liveStream.id);
    },
    likes(liveStream, _, { dataSources: { repository } }) {
      return repository.liveStream.getLikes(liveStream.id);
    },
    thumbnail: async (liveStream, _, { dataSources: { repository} }) => {
      return repository.asset.getById(liveStream.thumbnail);
    },
    isFeatured: async (liveStream, _, { dataSources: { repository} }) => {
      return !!liveStream.isFeatured;
    },
  },
  LiveStreamStats: {
    duration: getLiveStreamDuration,
    likes(liveStream, args, { dataSources: { repository } }) {
      return repository.like.getLikesCount(`LiveStream:${liveStream.id}`);
    },
    viewers(liveStream, args, { dataSources: { repository } }) {
      return repository.streamChannelParticipant.getViewersCount(liveStream.channel);
    },
  },
  StreamProductDuration: {
    product: async ({ product }, _, { dataSources: { repository } }) => {
      return repository.product.getById(product);
    }
  },
};
