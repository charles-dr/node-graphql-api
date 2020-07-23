const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { EmailService } = require(path.resolve('src/bundles/email'));
const { VerificationEmailTemplate } = require(path.resolve('src/lib/Enums'));

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository } }) => {

  const templateMapper = {
    [VerificationEmailTemplate.RESET_PASSWORD]: 'sendRecoverPasswordCode'
  }

  const validator = new Validator(args, {
    email: 'required|email',
    template: 'required',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.user.findByEmail(args.email))
    .then((user) => {
      if (!user) {
        throw new UserInputError('User does not exists');
      }
      return user;
    })
    .then((user) => (
      repository.verificationCode.deactivate(user.id)
        .then(() => repository.verificationCode.create({ user: user.id }))
        .then((newCode) => {
          return EmailService[templateMapper[args.template]]({user, code: newCode.code});
        })
        .catch((err) => {
          throw new ApolloError(err);
        })
        .then(() => true)
    ));
};
