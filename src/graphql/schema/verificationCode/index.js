const path = require('path');
const { gql } = require('apollo-server');

const { VerificationEmailTemplate } = require(path.resolve('src/lib/Enums'));
const sendVerificationCode = require('./resolvers/sendVerificationCode');
const sendVerificationCode2Phone = require('./resolvers/sendVerificationCode2Phone');
const checkPhoneVerificationCode = require('./resolvers/checkPhoneVerificationCode');
const sendCode2PhoneForUser = require('./resolvers/sendCode2PhoneForUser');
const sendCode2EmailForUser = require('./resolvers/sendCode2EmailForUser');
const checkEmailVerificationCode = require('./resolvers/checkEmailVerificationCode');

const schema = gql`
  enum VerificationEmailTemplateEnum {
    ${VerificationEmailTemplate.toGQL()}
  }

  input PhoneInfo {
    phone: String!,
    countryCode: String!
  }

  input EmailInfo {
    email: String!
  }

  input VerificationCodeInfo {
    request_id: String!
    code: String!
  }

  type VerificationInfo {
    id: String
  }

  type VerificationResult {
    result: Boolean!
    message: String
    code: String
  }

  extend type Mutation {
    sendCode2PhoneForUser(data: PhoneInfo!): Boolean!
    sendCode2EmailForUser(data: EmailInfo!): VerificationInfo!
    sendVerificationCode(email: String!, template: VerificationEmailTemplateEnum!): Boolean!
    sendVerificationCode2Phone(data: PhoneInfo!): VerificationInfo!
    checkPhoneVerificationCode(data: VerificationCodeInfo): VerificationResult!
    checkEmailVerificationCode(data: VerificationCodeInfo): VerificationResult!
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Mutation: {
    sendCode2PhoneForUser,
    sendVerificationCode,
    sendVerificationCode2Phone,
    checkPhoneVerificationCode,
    sendCode2EmailForUser,
    checkEmailVerificationCode,
  },
};
