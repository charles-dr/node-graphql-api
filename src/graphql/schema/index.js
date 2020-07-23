const { makeExecutableSchema, mergeSchemas } = require('graphql-tools');
const { merge } = require('lodash');

const { typeDefs: commonTypeDefs, resolvers: commonResolvers } = require('./common');
const { typeDefs: testErrorsTypeDefs, resolvers: testErrorsResolvers } = require('./common/testErrors');
const { typeDefs: authTypeDefs, auth } = require('./common/authDirective');
const { typeDefs: ifDiffersTypeDefs, ifDiffers } = require('./common/ifDiffersDirective');
const { typeDefs: i18nTypeDefs, resolvers: i18nResolvers } = require('./common/i18n');
const { typeDefs: addressTypeDefs, resolvers: addressResolvers } = require('./common/address');
const { typeDefs: latLngTypeDefs, resolvers: latLngResolvers } = require('./common/latLng');
const { typeDefs: dateTypeDefs, resolvers: dateResolvers } = require('./common/date');
const { typeDefs: anyTypeDefs, resolvers: anyResolvers } = require('./common/any');
const { typeDefs: pagerTypeDefs } = require('./common/pager');
const { typeDefs: sortTypeDefs } = require('./common/sort');

const { typeDefs: userTypeDefs, resolvers: userResolvers } = require('./user');
const { typeDefs: userBlockTypeDefs, resolvers: userBlockResolvers } = require('./userBlock');
const { typeDefs: userSettingsTypeDefs, resolvers: userSettingsResolvers } = require('./userSettings');
const { typeDefs: accessTokenTypeDefs, resolvers: accessTokenResolvers } = require('./accessToken');
const { typeDefs: liveStreamTokenTypeDefs, resolvers: liveStreamResolvers } = require('./liveStream');
const { typeDefs: sbTypeDefs, resolvers: sbResolvers } = require('./shippingBox');
const { typeDefs: countryTypeDefs, resolvers: countryResolvers } = require('./country');
const { typeDefs: languageTypeDefs, resolvers: languageResolvers } = require('./language');
const { typeDefs: regionTypeDefs, resolvers: regionResolvers } = require('./region');
const { typeDefs: organizationTypeDefs, resolvers: organizationResolvers } = require('./organization');
const { typeDefs: cityTypeDefs, resolvers: cityResolvers } = require('./city');
const { typeDefs: verificationCodeTypeDefs, resolvers: verificationCodeResolvers } = require('./verificationCode');
const { typeDefs: assetTypeDefs, resolvers: assetResolvers } = require('./asset');
const { typeDefs: streamChannelTypeDefs, resolvers: streamChannelResolvers } = require('./streamChannel');
const { typeDefs: messageTypeDefs, resolvers: messageResolvers } = require('./message');
const { typeDefs: notificationTypeDefs, resolvers: notificationResolvers } = require('./notification');
const { typeDefs: ratingTypeDefs, resolvers: ratingResolvers } = require('./rating');
const { typeDefs: notificationDataTypeDefs, resolvers: notificationDataResolvers } = require('./notification/notificationTypes');

const { typeDefs: commerceTypeDefs, resolvers: commerceResolvers } = require('./commerce');
const { typeDefs: paymentTypeDefs, resolvers: paymentResolvers } = require('./payment');

const { typeDefs: elasticTypeDefs, resolvers: elasticResolvers } = require('./elasticSearch');
const { typeDefs: translationTypeDefs, resolvers: translationResolvers } = require('./translation');
const { typeDefs: termsConditionTypeDefs, resolvers: termsConditionResolvers } = require('./termsConditions');
const { typeDefs: pushNotificationTypeDefs, resolvers: pushNotificationResolvers } = require('./pushNotification');

const { typeDefs: themeTypeDefs, resolvers: themeResolvers } = require('./theme');
const { typeDefs: bannerTypeDefs, resolvers: bannerResolvers } = require('./banner');
const { typeDefs: postTypeDefs, resolvers: postResolvers } = require('./post');
const { typeDefs: issueTypeDefs, resolvers: issueResolvers } = require('./issue');
const { typeDefs: vocabularyTypeDefs, resolvers: vocabularyResolvers } = require('./vocabulary');

const typeDefs = [].concat(
  commonTypeDefs,
  testErrorsTypeDefs,
  authTypeDefs,
  ifDiffersTypeDefs,
  i18nTypeDefs,
  userTypeDefs,
  userBlockTypeDefs,
  userSettingsTypeDefs,
  accessTokenTypeDefs,
  liveStreamTokenTypeDefs,
  sbTypeDefs,
  countryTypeDefs,
  regionTypeDefs,
  addressTypeDefs,
  latLngTypeDefs,
  dateTypeDefs,
  anyTypeDefs,
  pagerTypeDefs,
  sortTypeDefs,
  organizationTypeDefs,
  cityTypeDefs,
  verificationCodeTypeDefs,
  assetTypeDefs,
  streamChannelTypeDefs,
  messageTypeDefs,
  commerceTypeDefs,
  notificationDataTypeDefs,
  notificationTypeDefs,
  ratingTypeDefs,
  paymentTypeDefs,
  elasticTypeDefs,
  languageTypeDefs,
  translationTypeDefs,
  pushNotificationTypeDefs,
  termsConditionTypeDefs,
  themeTypeDefs,
  bannerTypeDefs,
  postTypeDefs,
  issueTypeDefs,
  vocabularyTypeDefs,
);

const resolvers = merge(
  commonResolvers,
  testErrorsResolvers,
  userResolvers,
  userBlockResolvers,
  userSettingsResolvers,
  i18nResolvers,
  accessTokenResolvers,
  liveStreamResolvers,
  sbResolvers,
  countryResolvers,
  regionResolvers,
  addressResolvers,
  latLngResolvers,
  dateResolvers,
  organizationResolvers,
  cityResolvers,
  verificationCodeResolvers,
  assetResolvers,
  streamChannelResolvers,
  messageResolvers,
  commerceResolvers,
  notificationDataResolvers,
  ratingResolvers,
  notificationResolvers,
  paymentResolvers,
  elasticResolvers,
  languageResolvers,
  translationResolvers,
  termsConditionResolvers,
  themeResolvers,
  bannerResolvers,
  postResolvers,
  issueResolvers,
  vocabularyResolvers,
  pushNotificationResolvers,
);

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  schemaDirectives: {
    auth,
    ifDiffers,
  },
});

module.exports = () => mergeSchemas({
  schemas: [
    schema,
  ],
});
