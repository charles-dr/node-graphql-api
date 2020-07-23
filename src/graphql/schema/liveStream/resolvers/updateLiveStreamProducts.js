const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError, ForbiddenError } = require('apollo-server');
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(args, {
    liveStream: "required",
  });

  validator.addPostRule(async provider => {
    const { liveStream, productDurations } = args;
    // validate livestream
    await repository.liveStream.load(liveStream)
      .then(liveStreamById => {
        if (!liveStreamById) provider.error('liveStream', 'custom', `Livestream with id "${liveStream}" does not exist!`);
        else if (liveStreamById.streamer !== user.id) provider.error('liveStream', 'custom', "You can not update this livestream!");
      })

    // validate products
    if (productDurations && productDurations.length) {
      const nullIds = [];
      const notOwnIds = [];
      await Promise.all(productDurations.map(el => repository.product.getById(el.product)
        .then(product => {
          if (!product) nullIds.push(el.product);
          else if (product.seller !== user.id) notOwnIds.push(el.product);
        })  
      ))
      if (nullIds.length) throw new UserInputError("Products not found!", { invalidArgs: nullIds });
      if (notOwnIds.length) throw new ForbiddenError(`You can't add these products "${notOwnIds.join(', ')}"`);
    }
  })

  return validator.check()
    .then(matched => {
      if (!matched) throw errorHandler.build(validator.errors);
      return repository.liveStream.load(args.liveStream);
    })
    .then(liveStream => {
      liveStream.productDurations = args.productDurations;
      return liveStream.save();
    })
}
