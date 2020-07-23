const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ForbiddenError } = require('apollo-server');
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

module.exports = async (_, { ids, status }, { dataSources: { repository }, user }) => {
  const validator = new Validator({ ids, status },
    {
      "ids": "required",
    });

    validator.addPostRule(async provider => {
      // validate if message threads exist or not.
      const nullIds = [];
      await Promise.all(ids.map(id => repository.messageThread.findOne(id)
          .then(messageThread => {
            if (!messageThread) nullIds.push(id);
          })
      ))
      if (nullIds.length) throw new UserInputError(`Not found the message threads!`, { invalidArgs: nullIds });
    })

    return validator.check()
      .then(matched => {
        if (!matched) {
          throw errorHandler.build(validator.errors);
        }
        return Promise.all(ids.map(id => repository.userHasMessageThread.findOne(id, user.id)));
      })
      .then(userHasMessageThreads => Promise.all(userHasMessageThreads.map(el => {
        el.muted = status.muted !== undefined ? status.muted : el.muted;
        el.hidden = status.hidden !== undefined ? status.hidden : el.hidden;
        return el.save();
      })))
      .then(userHasMessageThreads => Promise.all(userHasMessageThreads.map(el => repository.messageThread.findOne(el.thread))))    
}
