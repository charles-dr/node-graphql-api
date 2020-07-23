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
      throw new ForbiddenError('You cannot add products to this Live Stream');
    }
    return liveStream;
  },

  async addProductsToLiveStream({ liveStream, productDurations }, repository) {
    return Promise.all(productDurations.map(({ product, duration }) => repository.product.getById(product)))
      .then((products) => {
        products.forEach((product) => {
          if (!product) {
            throw new Error(`Product can not be addded to the Live Stream, because of Product "${product.id}" does not exist!`);
          }

          // if (product.seller !== liveStream.streamer) {
          //   throw new ForbiddenError(`You cannot add product "${product.id}" to this Live Stream`);
          // }

          if (liveStream.productDurations.some(({ product: productId }) => productId === product.id)) {
            return true;
          }

          const [PDInput] = productDurations.filter(pd => pd.product === product.id);
          return liveStream.productDurations.push(PDInput);
        });
        liveStream.productDurations.sort((pd1, pd2) => pd1.duration > pd2.duration ? 1 : -1)

        return liveStream.save();
      });
  },
};

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(
    args,
    { liveStream: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']] },
    { products: 'required' },
  );

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => activity.checkIfLiveStreamExist(args.liveStream, repository))
    .then((liveStream) => activity.checkLiveStreamOwner(liveStream, user))
    .then((liveStream) => activity.addProductsToLiveStream({ liveStream, productDurations: args.products }, repository))
    .then((liveStream) => {
      pubsub.publish(SubscriptionType.LIVE_STREAM_CHANGE, { id: liveStream._id, ...liveStream.toObject() });
      return liveStream;
    })
    .catch(e => {
      console.log('[error]', e);
      return null;
    });
};
