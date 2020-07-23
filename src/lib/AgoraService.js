const { AccessToken } = require('agora-access-token');
const path = require('path');
const request = require('request');
const AWS = require('aws-sdk');

const { Token, Priviledges } = AccessToken;
const { StreamRole } = require('./Enums');
//const AgoraRTC = require('agora-rtc-sdk');
const { agora, aws } = require(path.resolve('config'));
const logger = require(path.resolve('config/logger'));

if (agora.app_id == null) {
  logger.warn("You didn't provided APP_ID for Agora. You will not be able to work with streams");
}

if (agora.app_cert == null) {
  logger.warn("You didn't provided APP_CERT for Agora. You will not be able to work with streams");
}

if (agora.api_key == null) {
  logger.warn("You didn't provided API_KEY for Agora. You will not be able to store stream records");
}

if (agora.api_cert == null) {
  logger.warn("You didn't provided API_CERT for Agora. You will not be able to store stream records");
}

if (aws.agora_api_key == null) {
  logger.warn("You didn't provided ACCESS_KEY for AWS. You will not be able to store stream records");
}

if (aws.agora_api_secret == null) {
  logger.warn("You didn't provided ACCESS_SECRET_KEY for AWS. You will not be able to store stream records");
}

const authToken = Buffer.from(`${agora.api_key}:${agora.api_cert}`).toString('base64');
const authHeader = { Authorization: `Basic ${authToken}`, 'Content-type': 'application/json;charset=utf-8' };

const s3 = new AWS.S3({
  accessKeyId:aws.agora_api_key,
  secretAccessKey:aws.agora_api_secret
})

module.exports.AgoraService = {
  buildTokenWithAccount(channelName, account, role, privilegeExpiredTs = 0) {
    this.key = new Token(agora.app_id, agora.app_cert, channelName, account);
    this.key.addPriviledge(Priviledges.kJoinChannel, privilegeExpiredTs);
    if (role === StreamRole.PUBLISHER) {
      this.key.addPriviledge(Priviledges.kPublishAudioStream, privilegeExpiredTs);
      this.key.addPriviledge(Priviledges.kPublishVideoStream, privilegeExpiredTs);
      this.key.addPriviledge(Priviledges.kPublishDataStream, privilegeExpiredTs);
    }
    return this.key.build();
  },
  recording: {
    acquire(channelName, uid) {
      return new Promise((resolve, reject) => {
        request.post(`${agora.uri}/${agora.app_id}/cloud_recording/acquire`,
          {
            headers: authHeader,
            json: {
              cname: channelName,
              uid,
              clientRequest: {},
            },
          }, (err, res, body) => {
            if (err) {
              logger.error(`Failed to acquire recording for Channel(${channelName}). Original error: ${err}`);
              return reject(new Error(err));
            }
            if (res.statusCode !== 200 && res.statusCode !== 201) {
              logger.error(`Failed to acquire recording for Channel(${channelName}). Original error: ${body.message || body.reason}`);
              return reject(new Error(body.message || body.reason));
            }

            logger.info(`Successfuly acquired Resource(${body.resourceId}) for Channel(${channelName})`);
            return resolve(body);
          });
      });
    },
    start(channelName, uid, resourceId, token, mode = 'mix') {
      return new Promise((resolve, reject) => {
        request.post(`${agora.uri}/${agora.app_id}/cloud_recording/resourceid/${resourceId}/mode/${mode}/start`,
          {
            headers: authHeader,
            json: {
              cname: channelName,
              uid,
              clientRequest: {
                token,
                recordingConfig: {
                  maxIdleTime: 30,
                  streamTypes: 2,
                  channelType: 1,
                  subscribeUidGroup: 0,
                },
                storageConfig: {
                  vendor: 1,
                  region: aws.media_region_id,
                  bucket: aws.media_bucket,
                  accessKey: aws.agora_api_key,
                  secretKey: aws.agora_api_secret,
                  fileNamePrefix: [channelName.replace(/-/g, '')],
                },
              },
            },
          }, (err, res, body) => {
            if (err) {
              logger.error(`Failed to start recording Resource(${resourceId}) for Channel(${channelName}). Original error: ${err}`);
              return reject(new Error(err));
            }
            if (res.statusCode !== 200 && res.statusCode !== 201) {
              logger.error(`Failed to start recording Resource(${resourceId}) for Channel(${channelName}). Original error: ${body.message || body.reason}`);
              return reject(new Error(body.message || body.reason));
            }

            logger.info(`Successfuly started Resource(${body.resourceId}) SID(${body.sid}) for Channel(${channelName})`);
            return resolve(body);
          });
      });
    },
    stop(channelName, uid, resourceId, sid, mode = 'mix') {
      return new Promise((resolve, reject) => {
        request.post(`${agora.uri}/${agora.app_id}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/${mode}/stop`,
          {
            headers: authHeader,
            json: {
              uid,
              cname: channelName,
              clientRequest: {},
            },
          }, (err, res, body) => {
            if (err) {
              logger.error(`Failed to stop recording Resource(${resourceId}) SID(${sid}) for Channel(${channelName}). Original error: ${err}`);
              return reject(new Error(err));
            }
            if (res.statusCode !== 200 && res.statusCode !== 201) {
              logger.error(`Failed to stop recording Resource(${resourceId}) SID(${sid}) for Channel(${channelName}). Original error: ${body.message || body.reason}`);
              return reject(new Error(body.message || body.reason));
            }
            logger.info(`Successfuly stopped Resource(${body.resourceId}) SID(${body.sid}) for Channel(${channelName})`);
            return resolve(body);
          });
      });
    },
  },
  upload(stream,callback){
    const params = {
      Bucket:aws.media_bucket,
      key:stream.originalFilename,
      Body:JSON.stringify(stream)
    }

    s3.upload(params,function(s3Err,data){
      if(s3Err)
      {
        console.log(s3Err);
      }

      callback(data.Location);
    })
  },
  publish(location)
  {
    // var client = AgoraRTC.createClient({mode:'live',codec:'h264'});
    // var defaultConfigRTMP = {
    //   width: 640,
    //   height: 360,
    //   videoBitrate: 400,
    //   videoFramerate: 15,
    //   lowLatency: false,
    //   audioSampleRate: 48000,
    //   audioBitrate: 48,
    //   audioChannels: 1,
    //   videoGop: 30,
    //   videoCodecProfile: 100,
    //   userCount: 0,
    //   userConfigExtraInfo: {},
    //   backgroundColor: 0x000000,
    //   transcodingUsers: [],
    // };

    // AgoraRTC.Logger.setLogLevel(AgoraRTC.Logger.DEBUG);

    // client.init(agora.app_id,function(){
    //   client.addInjectStreamUrl(location,defaultConfigRTMP);
    // })
  }
};
