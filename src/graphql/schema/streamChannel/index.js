const path = require('path');
const { gql } = require('apollo-server');

const { cdn } = require(path.resolve('config'));
const {
  StreamChannelType, StreamRecordStatus, StreamChannelStatus, SourceType,
} = require(path.resolve('src/lib/Enums'));
const joinStreamChannel = require('./resolvers/joinStreamChannel');
const leaveStreamChannel = require('./resolvers/leaveStreamChannel');
const startStreaming = require('./resolvers/startStreaming');
const stopStreaming = require('./resolvers/stopStreaming');
const addStreaming = require('./resolvers/uploadstreamsource');

const schema = gql`
    enum StreamChannelType {
      ${StreamChannelType.toGQL()}
    }

    enum StreamRecordStatus {
      ${StreamRecordStatus.toGQL()}
    }

    enum StreamChannelStatus {
      ${StreamChannelStatus.toGQL()}
    }

    enum SourceType {
      ${SourceType.toGQL()}
    }

    type StreamRecordSource {
      id: ID!
      user: User!
      type: SourceType!
      source: String!,
      prerecorded:Boolean
    }

    type StreamRecord {
      enabled: Boolean!
      status: StreamRecordStatus!
      sources: [StreamRecordSource]!
    }
    

    type StreamParticipant {
      joinedAt: Date
      leavedAt: Date
      user: User
      isPublisher: Boolean!
    }

    type StreamChannel {
      """Think about it as about channel name"""
      id: ID!

      type: StreamChannelType

      status: StreamChannelStatus!
      
      """Token is a personal for logged user, or one for all guests"""
      token: String
      
      participants: [StreamParticipant]! 
      
      record: StreamRecord

      startedAt: Date

      finishedAt: Date
    }

    extend type Query {
      streamChannel(id: ID!): StreamChannel!
      # previousQueue(streamChannel: ID!, currentRecord: ID!): StreamRecordSource
      # nextQueue(streamChannel: ID!, currentRecord: ID!): StreamRecordSource
    }
  
    extend type Mutation {
        """
        When user try join the API generates token for this user and channel
        Pass ID of the Stream Channel created for Live Stream
        """
        joinStreamChannel(id: ID!): StreamChannel! @deprecated(reason: "Use 'joinLiveStream' instead")

        """
        Pass ID of the Stream Channel created for Live Stream
        """
        leaveStreamChannel(id: ID!): Boolean! @deprecated(reason: "Use 'leaveLiveStream' instead")

        """
        Allows: authorized user
        Pass ID of the Stream Channel created for Live Stream
        """
        startStreaming(id: ID!): StreamChannel! @auth(requires: USER)

        """
        Allows: authorized user
        Pass ID of the Stream Channel created for Live Stream
        """
        stopStreaming(id: ID!): StreamChannel! @auth(requires: USER)

        """
        Allows: authorized user
        Pass ID of the Stream Channel created for Live Stream
        """
        addStreaming(file:Upload!): StreamRecordSource! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

const { GraphQLUpload } = require('apollo-upload-server');

module.exports.resolvers = {
  Upload:GraphQLUpload,
  Query: {
    streamChannel(_, args, { dataSources: { repository } }) {
      return repository.streamChannel.load(args.id);
    },
  },
  Mutation: {
    joinStreamChannel,
    leaveStreamChannel,
    startStreaming,
    stopStreaming,
    addStreaming
  },
  StreamChannel: {
    participants(streamChannel, args, { dataSources: { repository } }) {
      return repository.streamChannelParticipant.getChannelParticipants(streamChannel.id);
    },
    token(streamChannel, args, { user, dataSources: { repository } }) {
      return repository.streamChannelParticipant.load(streamChannel.id, user ? user.id : null)
        .then((paticipant) => (paticipant ? paticipant.token : null));
    },
  },
  StreamParticipant: {
    user(participant, args, { dataSources: { repository } }) {
      return participant.user == null ? null : repository.user.load(participant.user);
    },
  },
  StreamRecord: {
    sources(streamRecord, args, { dataSources: { repository } }) {
      return repository.streamSource.getAll({ _id: streamRecord.sources });
    },
  },
  StreamRecordSource: {
    source(recordSource) {
      if(recordSource.prerecorded)
      {
        return recordSource.source;
      }
      else
      {
        return cdn.media + recordSource.source;  
      }
      
    },
  },
};
