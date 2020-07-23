const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ForbiddenError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const pubsub = require(path.resolve('config/pubsub'));
const { SubscriptionType } = require(path.resolve('src/lib/Enums'));

const errorHandler = new ErrorHandler();

const activity = {
  async checkIfLiveStreamExist(id, repository) {
    return repository.liveStream.load(id)
      .then((liveStream) => {
        if (!liveStream) {
          throw new UserInputError(`Live Stream "${id}" does not exist`, { invalidArgs: 'id' });
        }
        return liveStream;
      });
  },

  async checkLiveStreamOwner(liveStream, user) {
    if (liveStream.streamer !== user.id) {
      throw new ForbiddenError('You cannot remove product from this Live Stream');
    }
    return liveStream;
  },

  async removeProductFromLiveStream({ liveStream, productId }, repository) {
    return repository.product.getById(productId)
      .then((product) => {
        if (!product) {
          throw new Error(`Product can not be removed from the Live Stream, because of Product "${productId}" does not exist!`);
        }

        // if (product.seller !== liveStream.streamer) {
        //   throw new ForbiddenError('You cannot add products to this Live Stream');
        // }

        // const index = liveStream.products.indexOf(productId);

        // if (index === -1) {
        //   return liveStream;
        // }

        // liveStream.products.splice(index, 1);

        liveStream.productDurations = liveStream.productDurations.filter((pd) => pd.product !== productId)

        return liveStream.save();
      });
  },
};

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(
    args,
    { liveStream: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']] },
    { productId: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']] },
  );

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => activity.checkIfLiveStreamExist(args.liveStream, repository))
    .then((liveStream) => activity.checkLiveStreamOwner(liveStream, user))
    .then((liveStream) => activity.removeProductFromLiveStream({ liveStream, productId: args.productId }, repository))
    .then((liveStream) => {
      pubsub.publish(SubscriptionType.LIVE_STREAM_CHANGE, { id: liveStream._id, ...liveStream.toObject() });
      return liveStream;
    });
};
