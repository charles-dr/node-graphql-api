const path = require('path');
const { UserInputError } = require('apollo-server');

const { nexmoConfig } = require(path.resolve('config'));
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

const { EmailService } = require(path.resolve('src/bundles/email'));
const Nexmo = require('nexmo');

const nexmo = new Nexmo({
  apiKey: nexmoConfig.apiKey,
  apiSecret: nexmoConfig.apiSecret,
});

const activity = {
  validatePhoneNumber: async (args, repository) => {
    const validNumber = await phoneUtil.parse(args.phone);

    if (!phoneUtil.isValidNumberForRegion(validNumber, args.countryCode)) {
      if ((phoneUtil.getRegionCodeForNumber(validNumber) !== 'AR' && phoneUtil.getRegionCodeForNumber(validNumber) !== 'MX')
            || phoneUtil.getRegionCodeForNumber(validNumber) !== args.countryCode
            || !phoneUtil.isPossibleNumber(validNumber)) {
        throw new UserInputError('The phone number must be a valid phone number.', { invalidArgs: 'phone' });
      }
    }
    const user = await repository.user.findByPhone(args.phone);
    if (!user) {
      throw new UserInputError('User does not exist!');
    }
    return user;
  },
  validateEmail: async (args, repository) => {
    const re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    if (!re.test(args.email)) throw new UserInputError('The email is not valid!', { invalidArgs: 'email' });

    const user = await repository.user.findByEmail(args.email);
    if (!user) {
      throw new UserInputError('User does not exist!');
    }
    return user;
  },
};

module.exports = async (obj, args, { dataSources: { repository } }) => {
  const viaPhone = args.countryCode && args.phone;
  let user;
  if (viaPhone) {
    user = await activity.validatePhoneNumber(args, repository);
  } else {
    user = await activity.validateEmail(args, repository);
  }

  return repository.verificationCode.deactivate(user.id)
    .then(() => {
      if (viaPhone) {
        // send verification code to phone by sms
        return new Promise((resolve, reject) => {
          nexmo.verify.request({
            number: args.phone.replace('+', ''),
            brand: 'Shoclef',
            code_length: '6',
          }, (err, result) => {
            if (err) reject(err);
            if (result && result.status !== '0') reject(result.error_text);
            else resolve(result.request_id);
          });
        });
      }
      return repository.verificationCode.create({ user: user.id })
        .then((newCode) => EmailService.sendRecoverPasswordCode({ user, code: newCode.code }));
    })
    .then((requestId) => {
      if (viaPhone) return { success: true, request_id: requestId };
      return { success: true, request_id: null };
    })
    .catch((err) => {
      throw new UserInputError(err);
    });
};
