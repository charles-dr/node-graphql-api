const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError, ForbiddenError } = require('apollo-server');

const {
  StreamChannelStatus, StreamChannelType, StreamRecordStatus, StreamRole, SourceType,
} = require(path.resolve('src/lib/Enums'));
const logger = require(path.resolve('config/logger'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
// const { AgoraService } = require(path.resolve('src/lib/AgoraService'));

const errorHandler = new ErrorHandler();

async function getlivestreamsource(user, datasource, repository) {
  return new Promise((resolve, reject)=>{
    repository.streamSource.create({ 
      source: datasource,
      type: SourceType.VIDEO_AUDIO,
      user,
      prerecorded: true,
    }).then((streamsource) => {
      resolve(streamsource);
    });
  });
}

module.exports = async (obj, args, { dataSources: { repository } }) => {
  const validator = new Validator(args.data, {
    title: 'required',
    user: 'required',
  });

  const user = await repository.user.getById(args.data.user);

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => {
      const experience = repository.liveStreamExperience.getById(args.data.experience);
      if (!experience) {
        throw new UserInputError(`Live Stream Experience ${args.data.experience} does not exist`, { invalidArgs: 'experience' });
      }

      args.data.categories.map((category) => {
        const categoryObject = repository.liveStreamCategory.getById(category);
        if (!categoryObject) {
          throw new UserInputError(`Live Stream Category ${category} does not exist`, { invalidArgs: 'categories' });
        }
        return categoryObject;
      });
    })
    .then(() => repository.asset.load(args.data.preview))
    .then((asset) => {
      if (args.data.preview && !asset) {
        throw new UserInputError(`Asset ${args.data.preview} does not exist`, { invalidArgs: 'preview' });
      }
    })
    .then(() => Promise.all(args.data.products.map((productId) => repository.product.getById(productId))).then((products) => {
      products.forEach((product) => {
        if (!product) {
          throw new Error(`Product can not be addded to the Live Stream, because of Product "${product.id}" does not exist!`);
        }

        // if (product.seller !== user.id) {
        //   throw new ForbiddenError(`You cannot add product "${product.id}" to this Live Stream`);
        // }
      });
    }))
    .then(async () => {
      const channelId = uuid();
      const liveStreamId = uuid();
      // const agoraToken = AgoraService.buildTokenWithAccount(channelId, user.id, StreamRole.PUBLISHER);
      const agoraToken = '';

      let sources = [];

      if (args.data.liveStreamRecord.length > 0) {
        await Promise.all(
          args.data.liveStreamRecord.map(async (recordItem) => {
            sources.push(await getlivestreamsource(user, recordItem, repository));
          }),
        );
      } else {
        sources.push(await getlivestreamsource(user, "http://18.185.121.9:5000/" + channelId + "-record.mp4", repository)); 
      }

      const finisheddate = new Date();
      const starteddate = new Date(finisheddate - 10 * 60 * 1000);
      const channel = {
        _id: channelId,
        type: StreamChannelType.BROADCASTING,
        finishedAt: args.data.liveStreamRecord.length > 0 ? finisheddate : null,
        startedAt: args.data.liveStreamRecord.length > 0 ? starteddate : null,
        status: args.data.liveStreamRecord.length > 0 ? StreamChannelStatus.FINISHED : StreamChannelStatus.PENDING,
        record: {
          enabled: true,
          status: args.data.liveStreamRecord.length > 0 ? StreamRecordStatus.FINISHED : StreamRecordStatus.PENDING,
          sources,
        },
      };

      const messageThread = {
        tags: [`LiveStream:${liveStreamId}`],
        participants: [user],
      };

      const participant = {
        channel: channelId,
        token: agoraToken,
        user,
        isPublisher: true,
      };

      return Promise.all([
        liveStreamId,
        repository.streamChannel.create(channel),
        repository.messageThread.create(messageThread),
        repository.streamChannelParticipant.create(participant),
      ]);
    })
    .then(([_id, streamChannel, messageThread]) => {
      repository.userHasMessageThread.create({
        thread: messageThread.id,
        user: user.id,
        readBy: Date.now(),
        muted: true,
        hidden: true,
      }).catch((error) => {
        logger.error(`Failed to update User Thread on join public thread for user "${user.id}". Original error: ${error}`);
      });
      return repository.liveStream.create({
        _id,
        streamer: user,
        title: args.data.title,
        status: args.data.liveStreamRecord.length > 0 ? StreamChannelStatus.FINISHED : StreamChannelStatus.PENDING,
        experience: args.data.experience,
        categories: args.data.categories,
        city: args.data.city,
        preview: args.data.preview,
        channel: streamChannel,
        publicMessageThread: messageThread,
        products: args.data.products,
        length: 0,
        realViews: 0,
        realLikes: 0,
        fakeViews: 0,
        fakeLikes: 0,
      });
    })
    .catch((error) => {
      throw new ApolloError(`Failed to add Live Stream. Original error: ${error.message}`, 400);
    });
};
