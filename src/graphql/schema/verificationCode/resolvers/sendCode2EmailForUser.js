const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { EmailService } = require(path.resolve('src/bundles/email'));
const { VerificationEmailTemplate } = require(path.resolve('src/lib/Enums'));

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository } }) => {
  const templateMapper = {
    [VerificationEmailTemplate.SIGNUP]: 'sendVerificationCode',
  };

  const validator = new Validator(args.data, {
    email: 'required|email',
  });

  return validator.check()
    .then(async (matched) => {
      console.log('matched status', matched);
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.verificationCode.createForSingup())
    .then((newCode) => {
      console.log('created verificationcode', newCode);
      EmailService[templateMapper[VerificationEmailTemplate.SIGNUP]]({ user: { email: args.data.email }, code: newCode.code });
      return newCode;
    })
    .catch((err) => {
      throw new ApolloError(err);
    });
};
