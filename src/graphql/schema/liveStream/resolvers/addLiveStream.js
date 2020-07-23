const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError, ForbiddenError } = require('apollo-server');
const { slugify } = require('transliteration');

const {
  StreamChannelStatus, StreamChannelType, StreamRecordStatus, StreamRole, SourceType, VideoTag,
} = require(path.resolve('src/lib/Enums'));
const logger = require(path.resolve('config/logger'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { AgoraService } = require(path.resolve('src/lib/AgoraService'));
const { AssetService } = require(path.resolve('src/lib/AssetService'));

const errorHandler = new ErrorHandler();

async function getlivestreamsource(user,datasource,repository)
{
  return new Promise((resolve,reject)=>{
    repository.streamSource.create({source:datasource,type:SourceType.VIDEO_AUDIO,user,prerecorded:true}).then((streamsource)=>{
      resolve(streamsource);
    })
  })
}

async function generateSlug({ title }, repository) {
  let slug = slugify(title);
  const streamBySlug = await repository.liveStream.getOne({ slug });
  if (streamBySlug) {
    const rand = Math.floor(Math.random() * 1000);
    slug += `-${rand.toString().padStart(3, '0')}`;
    const streamBySlug2 = await repository.liveStream.getOne({ slug });
    if (streamBySlug2) return generateSlug({ title }, repository);
  }
  return slug;
}

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(args.data, {
    title: 'required',
  });

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
    .then(() => Promise.all(args.data.preview.map(assetId => repository.asset.load(assetId)))    
      .then(previews => {
        if (previews && previews.length > 0) {
          previews.filter(item => !item).forEach((preview, i) => {
            throw new Error(`Preview can not be addded to the Live Stream, because of Asset "${args.data.preview[i]}" does not exist!`);
          });
        }
      })
    )
    .then(() => Promise.all([repository.asset.load(args.data.previewVideo)])
      .then(([previewVideo]) => {
        if (args.data.previewVideo && !previewVideo) {
          throw new UserInputError(`Asset ${args.data.previewVideo} does not exist`, { invalidArgs: 'preview' });
        }
        // else if (!asset.forPreview) {
        //   throw new UserInputError(`Asset ${args.data.preview} is not for preview`, { invalidArgs: 'preview' });
        // }
      })
    )
    .then(() => Promise.all(args.data.productDurations.map((productDuration) => repository.product.getById(productDuration.product))).then((products) => {
      products.forEach((product, i) => {
        if (!product) {
          throw new Error(`Product can not be addded to the Live Stream, because of Product "${args.data.productDurations[i].product}" does not exist!`);
        }

        // if (product.seller !== user.id) {
        //   throw new ForbiddenError(`You cannot add product "${args.data.productDurations[i].product}" to this Live Stream`);
        // }
      });
    }))
    .then(() => repository.asset.getById(args.data.thumbnail).then(thumbnail => {
      if (!thumbnail) {
        throw new Error(`Thumbnail asset does not exist with id "${args.data.thumbnail}"!`);
      }
    }))

    .then(async() => {
      const channelId = uuid();
      const liveStreamId = uuid();
      // const agoraToken = AgoraService.buildTokenWithAccount(channelId, user.id, StreamRole.PUBLISHER);
      const agoraToken = '';

      let sources = [];

      args.data.liveStreamRecord = args.data.liveStreamRecord || [];
      if (args.data.liveStreamRecord.length > 0) {
        await Promise.all(
          args.data.liveStreamRecord.map(async (recordItem) => {
            sources.push(await getlivestreamsource(user, recordItem, repository));
          })
        );
      } else {
        sources.push(await getlivestreamsource(user,"https://recording.shoclef.com/" + channelId + "-record.mp4",repository)); 
      }

      finisheddate = new Date();
      starteddate = new Date(finisheddate - 10 * 60 * 1000);
      const channel = {
        _id: channelId,
        type: StreamChannelType.BROADCASTING,
        finishedAt:args.data.liveStreamRecord.length > 0?finisheddate:null,
        startedAt:args.data.liveStreamRecord.length > 0?starteddate:null,
        status: args.data.liveStreamRecord.length > 0?StreamChannelStatus.FINISHED:StreamChannelStatus.PENDING,
        record: {
          enabled: true,
          status: args.data.liveStreamRecord.length > 0?StreamRecordStatus.FINISHED:StreamRecordStatus.PENDING,
          sources:sources
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
        repository.streamChannelParticipant.create(participant)
      ]);
    })
    .then(async ([_id, streamChannel, messageThread]) => {
      repository.userHasMessageThread.create({
        thread: messageThread.id,
        user: user.id,
        readBy: Date.now(),
        muted: false,
        hidden: false,
      }).catch((error) => {
        logger.error(`Failed to update User Thread on join public thread for user "${user.id}". Original error: ${error}`);
      });
      console.log("channel =>", streamChannel);


      // resize thumbnail
      const thumbnail = await repository.asset.getById(args.data.thumbnail);
      
      if (thumbnail &&  (
        !thumbnail.resolution ||
        (thumbnail.resolution.width && thumbnail.resolution.width > 500))) {
        await AssetService.resizeImage({ assetId: args.data.thumbnail, width: 500 });
      }

      return repository.liveStream.create({
        _id,
        streamer: user,
        title: args.data.title,
        status: args.data.liveStreamRecord.length > 0 ? StreamChannelStatus.FINISHED : StreamChannelStatus.PENDING,
        experience: args.data.experience,
        categories: args.data.categories,
        city: args.data.city,
        preview: args.data.preview,
        previewVideo: args.data.previewVideo || null,
        channel: streamChannel,
        publicMessageThread: messageThread,
        // products: args.data.products,
        length: 0,
        realViews: 0,
        realLikes: 0,
        fakeViews: 0,
        fakeLikes: 0,
        startTime: args.data.startTime ? new Date(args.data.startTime) : new Date(),
        productDurations: args.data.productDurations,
        orientation: args.data.orientation,
        thumbnail: args.data.thumbnail,
        isFeatured: args.data.isFeatured,
        hashtags: args.data.hashtags || [],
        videoTags: [VideoTag.New],
        slug: await generateSlug({ title: args.data.title }, repository),
      });
    })
    .catch((error) => {
      throw new ApolloError(`Failed to add Live Stream. Original error: ${error.message}`, 400);
    });
};
