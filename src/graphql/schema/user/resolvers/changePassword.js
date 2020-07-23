const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { verificationCode, nexmoConfig } = require(path.resolve('config'));
const { EmailService } = require(path.resolve('src/bundles/email'));

const errorHandler = new ErrorHandler();
const Nexmo = require('nexmo');

const nexmo = new Nexmo({
  apiKey: nexmoConfig.apiKey,
  apiSecret: nexmoConfig.apiSecret,
});
const verifyResponseCode = {
  3: 'INVALID_REQUEST_ID',
  16: 'INVALID_CODE',
  6: 'NOT_FOUND_OR_ALREADY_VERIFIED',
};

module.exports = async (obj, args, { dataSources: { repository } }) => {
  const validator = new Validator(args, {
    email: 'email',
    phone: 'phoneNumber',
    verificationCode: 'required|string',
    newPassword: 'required|minLength:6|regex:^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])',
    '*': 'any:password,request_id',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => {
      if (args.email) return repository.user.findByEmail(args.email);
      if (args.phone && !args.request_id) { throw new UserInputError('request_id required'); }
      const phoneVerify = new Promise((resolve, reject) => {
        nexmo.verify.check({
          request_id: args.request_id,
          code: args.verificationCode,
        }, (err, result) => {
          if (result.status != 0) {
            reject(verifyResponseCode[result.status]);
          } else {
            resolve(true);
          }
        });
      });

      return phoneVerify.then(() => repository.user.findByPhone(args.phone))
        .catch((err) => {
          throw new UserInputError(err);
        });
    })

    .then((existingUser) => {
      if (!existingUser) {
        throw new UserInputError('User does not exists');
      }
      return existingUser;
    })
    .then((user) => {
      if (args.password) {
        if (args.email) {
          return repository.user
            .findByEmailAndPassword(args)
            .then((user) => {
              if (!user) {
                throw new UserInputError('Wrong password');
              }

              return repository.user.changePassword(user.id, args.newPassword);
            });
        } if (args.phone) {
          return repository.user
            .findByPhoneAndPassword(args)
            .then((user) => {
              if (!user) {
                throw new UserInputError('Wrong password');
              }

              return repository.user.changePassword(user.id, args.newPassword);
            });
        }
      }

      if (args.email) {
        return repository.verificationCode
          .getByCodeAndUser(args.verificationCode, user.id)
          .then((code) => {
            if (!code) {
              throw new UserInputError('Verification code is not valid');
            }
            return code;
          })
          .then((code) => {
            const creationDate = new Date(code.createdAt);
            const expirationdate = new Date(creationDate)
              .setSeconds(creationDate.getSeconds() + verificationCode.TTL);
            if (expirationdate <= new Date()) {
              throw new UserInputError('Code is expired');
            }
          })
          .then(() => Promise.all([
            repository.verificationCode.deactivate(user.id),
            repository.user.changePassword(user.id, args.newPassword),
          ]));
      } if (args.phone) {
        return repository.user.changePassword(user.id, args.newPassword);
      }
    })
    .then((data) => {
      const user = data[1] || data;

      EmailService.sendPasswordChanged({ user });

      return user;
    })
    .then(() => true);
};
