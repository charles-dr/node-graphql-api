const path = require('path');
const uuid = require('uuid/v4');
const promise = require('bluebird');
const { ApolloError } = require('apollo-server');

const repository = require(path.resolve('src/repository'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));

const AWS = require('aws-sdk');
const { aws, cdn } = require(path.resolve('config'));
const csv = require('csvtojson');

const { InventoryLogType } = require(path.resolve('src/lib/Enums'));

const s3 = new AWS.S3();

module.exports = async (_, { fileName }, data) => {
    return new Promise(async (resolve, reject) => {
        const params = {
            Bucket: aws.user_bucket,
            Key: fileName
        }

        const stream = s3.getObject(params).createReadStream();
        stream.on('error', (err) => {
            reject(new Error("csv not exists on s3 bucket."));
        });
        
        const json = await csv().fromStream(stream);
        resolve(json);
    }).then(data => {
        return JSON.stringify(data);
    }).catch(err => {
        return new ApolloError(err.message);
    })
}