const path = require('path');
const AWS = require('aws-sdk');

const { aws, logs } = require(path.resolve('config'));

const s3 = new AWS.S3({
    accessKeyId: aws.aws_api_key,
    secretAccessKey: aws.aws_access_key,
    useAccelerateEndpoint: true
});

const params = {
    Bucket: aws.user_bucket,
    Key: "key.jpg",
    Expires: 60 * 60, // expiry time
    ACL: "bucket-owner-full-control",
    ContentType: "image/jpeg" // this can be changed as per the file type
};

module.exports = async () => {

    return { key: aws.aws_api_key, secret: aws.aws_access_key, region: logs.awsRegion, bucket: aws.user_bucket }
    // return await new Promise((resolve, reject) => {
    //     s3.getSignedUrl("putObject", params, (err, url) => {
    //         if (err)
    //             reject(err)

    //         resolve(url)
    //     })
    // })
}