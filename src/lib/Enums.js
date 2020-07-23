const fs = require('fs');
const path = require('path');
const CountryLanguage = require('country-language');

const languages = CountryLanguage.getLanguages();

function EnumFactory(object) {
  return Object.freeze({
    ...object,
    toGQL: () => Object.values(object).join(' '),
    toList: () => Object.values(object),
  });
}

const StreamChannelType = EnumFactory({
  BROADCASTING: 'BROADCASTING',
  VIDEO_CALL: 'VIDEO_CALL',
  VOICE_CALL: 'VOICE_CALL',
});

const StreamRecordStatus = EnumFactory({
  PENDING: 'PENDING',
  RECORDING: 'RECORDING',
  FINISHED: 'FINISHED',
  FAILED: 'FAILED',
});

const StreamChannelStatus = EnumFactory({
  PENDING: 'PENDING',
  STREAMING: 'STREAMING',
  FINISHED: 'FINISHED',
  ARCHIVED: 'ARCHIVED',
  CANCELED: 'CANCELED',
});

const StreamRole = EnumFactory({
  PUBLISHER: 1,
  SUBSCRIBER: 2,
});

const SourceType = EnumFactory({
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  VIDEO_AUDIO: 'VIDEO_AUDIO',
});

const MessageType = EnumFactory({
  TEXT: 'TEXT',
  STICKER: 'STICKER',
  ASSET: 'ASSET',
});

const LoginProvider = EnumFactory({
  FACEBOOK: 'FACEBOOK',
  GOOGLE: 'GOOGLE',
  WE_CHAT: 'WE_CHAT',
});

const MeasureSystem = EnumFactory({
  SI: 'SI',
  USC: 'USC',
});

const SizeUnitSystem = EnumFactory({
  INCH: 'INCH',
  CENTIMETER: 'CENTIMETER',
});

const WeightUnitSystem = EnumFactory({
  OUNCE: 'OUNCE',
  GRAM: 'GRAM',
});

const currencyEnum = {};
fs.readdirSync(path.resolve('src/lib/CurrencyFactory/currencies/')).forEach((file) => {
  const { name } = path.parse(file);
  currencyEnum[name] = name;
});
const Currency = EnumFactory(currencyEnum);

const InventoryLogType = EnumFactory({
  USER_ACTION: 'USER_ACTION',
  PURCHASE: 'PURCHASE',
  REFUND: 'REFUND',
  BUYER_CART: 'BUYER_CART',
});

const VerificationEmailTemplate = EnumFactory({
  RESET_PASSWORD: 'RESET_PASSWORD',
  CONFIRM_EMAIL: 'CONFIRM_EMAIL',
  WELCOME: 'WELCOME',
  INVOICE: 'INVOICE',
  PACKINGSLIP: 'PACKINGSLIP',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  NEW_ISSUE: 'NEW_ISSUE',
  SIGNUP: 'SIGNUP',
});

const NotificationType = EnumFactory({
  SYSTEM: 'SYSTEM',
  MESSAGE: 'MESSAGE',
  SELLER_ORDER: 'SELLER_ORDER',
  BUYER_ORDER: 'BUYER_ORDER',
});

const PushNotification = EnumFactory({
  CHATS: 'CHATS',
  ORDERS: 'ORDERS',
  PROFILE: 'PROFILE',
});

const ComplaintReason = EnumFactory({
  NUDITY: 'NUDITY',
  VIOLENCE: 'VIOLENCE',
  SUICIDE_OR_SELF_INJURY: 'SUICIDE_OR_SELF_INJURY',
  HATE_SPEECH: 'HATE_SPEECH',
  VIOLATING_COPYRIGHT: 'VIOLATING_COPYRIGHT',
  USAGE_OF_PROFANITY: 'USAGE_OF_PROFANITY',
  HARASSMENT: 'HARASSMENT',
  FALSE_NEWS: 'FALSE_NEWS',
  ILLEGAL_SALES: 'ILLEGAL_SALES',
});

const MarketType = EnumFactory({
  DOMESTIC: 'DOMESTIC',
  INTERNATIONAL: 'INTERNATIONAL',
});

const PurchaseOrderStatus = EnumFactory({
  CREATED: 'CREATED',
  ORDERED: 'ORDERED',
  CARRIER_RECEIVED: 'CARRIER_RECEIVED',
  DELIVERED: 'DELIVERED',
  COMPLETE: 'COMPLETE',
  CANCELED: 'CANCELED',
});

const SaleOrderStatus = EnumFactory({
  CREATED: 'CREATED',
  CARRIER_RECEIVED: 'CARRIER_RECEIVED',
  DELIVERED: 'DELIVERED',
  COMPLETE: 'COMPLETE',
  CANCELED: 'CANCELED',
});

const DeliveryOrderStatus = EnumFactory({
  // When Carrier donesn't know this tracking id, not yet in system
  CREATED: 'CREATED',
  UNKNOWN: 'UNKNOWN',
  ACCEPTED: 'ACCEPTED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  CONFIRMED: 'CONFIRMED',
  SHIPPED: 'SHIPPED',
  CANCELED: 'CANCELED'
});

const OrderItemStatus = EnumFactory({
  CREATED: 'CREATED',
  ORDERED: 'ORDERED',
  CARRIER_RECEIVED: 'CARRIER_RECEIVED',
  DELIVERED: 'DELIVERED',
  COMPLETE: 'COMPLETE',
  CONFIRMED: "CONFIRMED",
  SHIPPED: "SHIPPED",
  CANCELED: "CANCELED",
});

const PaymentTransactionStatus = EnumFactory({
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAIL: 'FAIL',
  REFUND: 'REFUND',
});

const PaymentMethodProviders = EnumFactory({
  STRIPE: 'Stripe',
  APPLEPAY: 'APPLEPAY',
  GOOGLEPAY: 'GOOGLEPAY',
  RAZORPAY: 'RazorPay',
  ALIPAY: 'Alipay',
  WECHATPAY: 'WeChatPay',
  LINEPAY: 'LinePay',
  PAYPAL: 'PayPal',
  UNIONPAY: 'UnionPay',
  BRAINTREE: 'Braintree',
});

const ProductMetricUnits = EnumFactory({
  PIECE: 'PIECE',
  SET: 'SET',
  SQ_METER: 'SQ_METER',
  OUNCE: 'OUNCE',
  CASE: 'CASE',
  PALLET: 'PALLET',
  TRUCKLOAD: 'TRUCKLOAD',
});

const VideoCropMode = EnumFactory({
  AUTO_PAD: 'AUTO_PAD',
  FILL_FRAME: 'FILL_FRAME'
});

const OrientationMode = EnumFactory({
  LANDSCAPE: 'LANDSCAPE',
  PORTRAIT: 'PORTRAIT',
});

const ThemeType = EnumFactory({
  NORMAL: 'NORMAL',
  LIMITED_TIME: 'LIMITED_TIME',
  DISCOUNT: 'DISCOUNT',
});

const BannerAdType = EnumFactory({
  CATEGORY: "CATEGORY",
  PRODUCT: "PRODUCT",
  PROMOTION: "PROMOTION",
  SUGGESTION: "SUGGESTION",
  THEME: "THEME",
  THEME_PRODUCT: "THEME_PRODUCT",
});

const BannerLayoutType = EnumFactory({
  CAROUSEL: "CAROUSEL",
  FLASH: "FLASH",
  FLOATING: "FLOATING",
  ROTATING: "ROTATING",
  STATIC: "STATIC",
});

const BannerType = EnumFactory({
  PNG: "PNG",
  JPG: "JPG",
  GIF: "GIF",
  MP4: "MP4",
});

const GenderType = EnumFactory({
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
});

const RatingTarget = EnumFactory({
  PRODUCT: 'PRODUCT',
  USER: 'USER',
  ORGANIZATION: 'ORGANIZATION',
});

const SubscriptionType = EnumFactory({
  POST_ADDED: "POST_ADDED",
  POST_UPDATED: "POST_UPDATED",
  MESSAGE_ADDED: "MESSAGE_ADDED",
  LIVE_STREAM_CHANGE: "LIVE_STREAM_CHANGE",
  LIVE_STREAM_LIKED: 'LIVE_STREAM_LIKED',
});

const IssueStatus = EnumFactory({
  CREATED: "CREATED",
  UNDER_REVIEW: "UNDER_REVIEW",
  SOLVED: "SOLVED",
});

const languageEnum = {};
languages.forEach((item) => {
  // const name = item.iso639_1.toUpperCase();
  // const name = item.iso639_2en == '' ? item.iso639_3.toUpperCase() : item.iso639_2en.toUpperCase();
  // languageEnum[name.split('-')[0]] = name.split('-')[0];

  const limitedList = ["EN", 'ZH', 'KO', 'JA', 'MS','ID', 'AR', 'ES', 'FR', 'PT', 'RU'].sort();
  limitedList.forEach(val => languageEnum[val] = val);
});

const LanguageList = EnumFactory(languageEnum);

const UserRoles = EnumFactory({
  SUPERADMIN: 'SuperAdmin',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
});

const IssueUrgency = EnumFactory({
  LOW: "Low",
  MEDIUM: "NORMAL",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
});

const DiscountValueType = EnumFactory({
  PERCENT: "PERCENT",
  FIXED: "FIXED",
  FREE_SHIPPING: "FREE_SHIPPING",
});
const DiscountPrivileges = EnumFactory({
  CUSTOMERS: "CUSTOMERS",
  EVERYONEY: "EVERYONEY",
});

const VideoTag = EnumFactory({
  New: 'New',
  Streaming: 'Streaming',
  Trending: 'Trending',
  Hot: 'Hot',
});


module.exports = {
  StreamChannelType,
  StreamRecordStatus,
  StreamChannelStatus,
  StreamRole,
  DiscountPrivileges,
  DiscountValueType,
  SourceType,
  MessageType,
  LoginProvider,
  SizeUnitSystem,
  Currency,
  InventoryLogType,
  VerificationEmailTemplate,
  NotificationType,
  MeasureSystem,
  WeightUnitSystem,
  PushNotification,
  ComplaintReason,
  MarketType,
  PurchaseOrderStatus,
  SaleOrderStatus,
  DeliveryOrderStatus,
  OrderItemStatus,
  PaymentTransactionStatus,
  PaymentMethodProviders,
  LanguageList,
  ProductMetricUnits,
  VideoCropMode,
  OrientationMode,
  ThemeType,
  BannerAdType,
  BannerLayoutType,
  BannerType,
  GenderType,
  RatingTarget,
  SubscriptionType,
  IssueStatus,
  UserRoles,
  IssueUrgency,
  VideoTag,
};
