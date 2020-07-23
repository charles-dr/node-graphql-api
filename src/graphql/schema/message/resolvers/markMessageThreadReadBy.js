const path = require('path');
const { Validator } = require('node-input-validator');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

module.exports = (_, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(args,
    { thread: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']] },
    { time: ['required', 'isISO8601'] });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.userHasMessageThread.updateTime(args.thread, user.id, args.time))
    .then((threadUserRead) => repository.messageThread.findOne(threadUserRead.thread));
};
