const { UserInputError } = require('apollo-server');

class ErrorHandler {
  // eslint-disable-next-line class-methods-use-this
  build(errors) {
    const res = [];
    Object.keys(errors).forEach((key) => {
      res.push(new UserInputError(errors[key].message, { invalidArgs: key }));
    });

    return res[0];
  }
}

module.exports.ErrorHandler = ErrorHandler;
