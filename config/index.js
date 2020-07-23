/* eslint-disable global-require */
/* eslint-disable eqeqeq */

const env = (process.env.NODE_ENV || 'development').trim();

if (env === 'development' || env === 'test') {
  require('dotenv').config({ path: `${__dirname}/../.env` });
}
const isDebugMode = (process.env.DEBUG_MODE || '').trim() == '1';
const isTestPaymentMode = (process.env.PAYMENT_TEST_MODE || null) !== 'disabled';
const domain = process.env.DOMAIN;
const protocol = process.env.PROTOCOL;

module.exports = {
  domain,
  protocol,
  baseURL: `${protocol}://${domain}/`,
  pythonServer: process.env.PYTHON_SERVER,
  translationServers: [

  ],
  keywordServers: [

  ],
  logs: {
    name: 'api',
    level: isDebugMode ? 'debug' : 'info',
    cloudWatchEnabled: (process.env.LOGS_CLOUD_WATCH || '').trim() == '1' || false,
    awsRegion: process.env.LOGS_CLOUD_WATCH_REGION || '',
  },
  env,
  isDebugMode,
  port: 4000,
  corsDomain: process.env.CORS_DOMAIN || '*',
  apolloEngineApiKey: process.env.ENGINE_API_KEY || null,
  mongo: {
    uri: process.env.MONGO_URI,
    migrateUri: env === 'development' ? process.env.MONGO_MIGRATE_URI : process.env.MONGO_URI,
  },
  i18n: {
    defaultLocale: 'EN',
    locales: ['EN'],
  },
  cdn: {
    appAssets: process.env.CDN_APP_ASSETS_DOMAIN,
    media: process.env.CDN_MEDIA_DOMAIN,
    userAssets: process.env.CDN_USER_ASSETS_DOMAIN,
    vendorBuckets: process.env.CDN_VENDOR_DASHBOARD_BUCKET,
    razington: process.env.CDN_REZINGTON_VENDOR_IMAGES_UPLOADS,
    aliexpress: process.env.CDN_ALIEXPRESS_SCRAPPED_IMAGES_FULL_SIZE,
  },
  aws: {
    agora_api_key: process.env.AWS_AGORA_ACCESS_KEY_ID || null,
    agora_api_secret: process.env.AWS_AGORA_SECRET_ACCESS_KEY || null,
    app_bucket: process.env.AWS_APP_BUCKET,
    media_bucket: process.env.AWS_MEDIA_BUCKET,
    user_bucket: process.env.AWS_USER_ASSETS_BUCKET,
    upload_bucket: process.env.AWS_UPLOAD_BUCKET,
    vendor_bucket: process.env.AWS_VENDORS_DASHBOARD_BUCKET,
    aliexpress_scrapped: process.env.AWS_ALIEXPRESS_SCAPPED_IMAGES,
    media_region_id: parseInt(process.env.AWS_MEDIA_REGION_ID || 0, 10),
    aws_api_key: process.env.AWS_APP_KEY,
    aws_access_key: process.env.AWS_APP_SECRET,
  },
  google: {
    places_uri: 'https://maps.googleapis.com/maps/api/place',
    api_key: process.env.GOOGLE_API_KEY || null,
    oauth_uri: 'https://www.googleapis.com/oauth2/v1',
    translation_credential: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  },
  facebook: {
    api_uri: 'https://graph.facebook.com',
  },
  agora: {
    uri: 'https://api.agora.io/v1/apps',
    app_id: process.env.AGORA_APP_ID || null,
    app_cert: process.env.AGORA_APP_CERT || null,
    api_key: process.env.AGORA_API_KEY || null,
    api_cert: process.env.AGORA_API_CERT || null,
  },
  assets: {
    types: {
      IMAGE: 'IMAGE',
      VIDEO: 'VIDEO',
      PDF: 'PDF',
      CSV: 'CSV',
    },
  },
  tests: {
    entrypoint: process.env.TEST_ENTRYPOINT || null,
  },
  verificationCode: {
    TTL: 1800,
  },
  exchangeCurrencyRates: {
    TTL: 10 * 60 * 1000,
  },
  email: {
    from: process.env.ELASTIC_EMAIL_FROM,
    bodyType: 'HTML',
    supportEmail: process.env.COMPANY_EMAIL,
    elasticEmailOptions: {
      apiKey: process.env.ELASTIC_EMAIL_API_KEY,
      apiUri: 'https://api.elasticemail.com/',
      apiVersion: 'v2',
    },
  },
  ses: {
    sesConfig: {
      apiVersion: '2010-12-01',
      accessKeyId: process.env.AWS_APP_KEY,
      secretAccessKey: process.env.AWS_APP_SECRET,
      region: process.env.LOGS_CLOUD_WATCH_REGION,
    },
    from: process.env.COMPANY_EMAIL,
    configurationSetName: 'sendemail',
  },
  awsSMTP: {
    headers: {
      'X-SES-CONFIGURATION-SET': 'sendemail',
      'X-SES-MESSAGE-TAGS': 'key0=value0',
      'X-SES-MESSAGE-TAGS': 'key1=value1',
    },
    config: {
      host: 'email-smtp.eu-central-1.amazonaws.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.AWS_SES_SMTP_USER,
        pass: process.env.AWS_SES_SMTP_PASS,
      },
    },
    from: process.env.COMPANY_EMAIL,
    fromOther: '<Info@gxjiteng.com>',
  },
  shoclefCompany: {
    seller: {
      name: 'Shoclef Inc',
      phone: '+15107170000',
    },
    address: {
      street_1: '1245 N Ogden Dr',
      street_2: '',
      country: 'US',
      zipCode: '90046',
      city: 'West Hollywood',
      state: 'CA',
    },
  },
  payment: {
    testMode: isTestPaymentMode,
    providers: {
      wirecard: {
        entrypoint: isTestPaymentMode
          ? 'https://api-test.wirecard.com/engine/rest/payments/'
          : '',
        merchantId: process.env.PAYMENT_WIRECARD_MERCHANT_ID || null,
        secret: process.env.PAYMENT_WIRECARD_SECRET || null,
      },
      stripe: {
        secret: process.env.PAYMENT_STRIPE_SECRET,
        publishable: process.env.STRIPE_PUBLISHABLE_KEY,
        webhook: process.env.STRIPE_WEBHOOK_SECRET,
      },
      razorpay: {
        keyID: process.env.PAYMENT_RAZORPAY_KEY_ID,
        keySecret: process.env.PAYMENT_RAZORPAY_KEY_SECRET,
      },
      paypal: {
        mode: process.env.PAYMENT_PAYPAL_MODE,
        client_id: process.env.PAYMENT_PAYPAL_CLIENT,
        client_secret: process.env.PAYMENT_PAYPAL_SECRET,
      },
      linepay: {
        bot_channel_secret: process.env.PAYMENT_LINE_BOT_CHANNEL_SECRET,
        bot_access_token: process.env.PAYMENT_LINE_BOT_ACCESS_TOKEN,
        pay_channel_ID: process.env.PAYMENT_LINE_PAY_CHANNEL_ID,
        pay_channel_secret: process.env.PAYMENT_LINE_PAY_CHANNEL_SECRET,
        confirmURL: process.env.PAYMENT_LINE_PAY_CONFIRM_URL,
        cancelUrl: process.env.PAYMENT_LINE_PAY_CANCEL_URL,
      },
      unionpay: {
        mode: process.env.PAYMENT_UNIONPAY_MODE,
        privateKeyPath: process.env.PAYMENT_UNIONPAY_PRIVATE_KEYPATH,
        publicKeyPath: process.env.PAYMENT_UNIONPAY_PUBLIC_KEYPATH,
        password: process.env.PAYMENT_UNIONPAY_PRIVATE_PASSWORD,
        merchantId: process.env.PAYMENT_UNIONPAY_MERCHANT_ID,
      },
      braintree: {
        accessToken: process.env.BRAINTREE_ACCESS_TOKEN,
      },
    },
  },
  shipengine: {
    uri: 'https://api.shipengine.com/v1',
    api_key: process.env.SHIPENGINE_API_KEY || null,
    // 1 week in seconds
    addressCacheTTL: 60 * 60 * 24 * 7,
    deliveryRateCacheTTL: 60 * 60 * 24 * 7,
  },
  easyPost: {
    uri: 'https://api.easypost.com/v2',
    // api_key: env === 'development' ? process.env.EASY_POST_TEST_API_KEY : process.env.EASY_POST_PROD_API_KEY
    api_key: process.env.EASY_POST_PROD_API_KEY,
    deliveryRateCacheTTL: 60 * 60 * 24 * 7,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  robots: {
    cancelLiveStreamIn: 30 * 60 * 1000,
  },
  oneSignal: {
    restApi_key: process.env.PUSH_NOTIFICATION_ONESIGNAL_RESTAPIKEY,
    auth_key: process.env.PUSH_NOTIFICATION_ONESIGNAL_AUTHKEY,
    app_id: process.env.PUSH_NOTIFICATION_ONESIGNAL_APPID,
  },
  nexmoConfig: {
    apiKey: process.env.NEXMO_API_KEY,
    apiSecret: process.env.NEXMO_API_SECRET,
  },
  xRapidAPIConfig: {
    apiKey: process.env.X_RAPIDAPI_KEY,
    host: process.env.X_RAPIDAPI_HOST,
    url: process.env.X_RAPIDAPI_TRANSLATE_URL,
  },
  internal: {
    translation: process.env.INTERNAL_PYTHON_TRANSLATION,
  },
  query: {
    getProduct: `query getProduct($ID: ID!){
      product (
        id: $ID
      ) {
        id
        assets {
          id
          url
        }
      }
    }`,
    getPurchaseOrderForEmail: `query getPurchaseOrder($orderID: ID!){
        purchaseOrder (
          id: $orderID
        ) {
          id
          total {
            amount
            currency
            formatted
          }
          price {
            amount
            currency
            formatted
          }
          deliveryPrice {
            amount
            currency
            formatted
          }
          tax {
            amount
            currency
            formatted
          }
          buyer {
            id
            email
            name
            phone
            address {
              street
              city
              region {
                name
              }
              country {
                name
              }
            }
          }
          createdAt
          paymentInfo
          items {
            id
            title
            quantity
            product {
              id
              title
              sku
              assets {
                url
              }
              price {
                amount
                currency
                formatted
              }
            }
            productAttribute {
              id
              sku
              price {
                amount
                currency
                formatted
              }
              asset {
                url
              }
              variation {
                name
                value
              }
            }
            price {
              amount
              currency
              formatted
            }
            subtotal {
              amount
              currency
              formatted
            }
            total {
              amount
              currency
              formatted
            }
            seller {
              name
            }
            deliveryPrice {
              amount
              currency
              formatted
            }
            deliveryOrder {
              estimatedDeliveryDate
              deliveryAddress {
                id
                city
                street 
                region {
                  id
                  name
                }
                country {
                  id
                  name
                }
              }
            }
            billingAddress {
              id
              city
              street 
              region {
                id
                name
              }
              country {
                id
                name
              }
            }
          }
        }
      }
    `,
    getSaleOrderForEmail: `query getSaleOrder($orderID: ID!){
      saleOrder(
        id: $orderID
      ){
        id
        buyer {
          id
          name
          email
          phone
        }
        seller {
          id
          name
          email
          phone
        }
        purchaseOrder {
          id
          createdAt
        }
        items {
          id
          note
          title
          seller {
            name
            email
            phone
            organization {
              address {
                street
                city
                region {
                  id
                  name
                }
                country {
                  id
                  name
                }
              }
            }
          }
          product {
            id
            title
            sku
            assets {
              url
            }
            price {
              amount
              currency
              formatted
            }
          }
          productAttribute {
            id
            sku
            price {
              amount
              currency
              formatted
            }
            asset {
              url
            }
            variation {
              name
              value
            }
          }
          quantity
          price {
            currency
            amount
            formatted
          }
          total {
            amount
            currency
            formatted
          }
          subtotal {
            amount
            currency
            formatted
          }
          deliveryOrder {
            id
            estimatedDeliveryDate 
            deliveryAddress {
              id
              city
              region {
                id
                name
              }
              country {
                id
                name
              }
              street
            }
          }
        }
      }
    }
    `,
  },
};
