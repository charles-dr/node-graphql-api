const path = require('path');
const uuid = require('uuid/v4');
const promise = require('bluebird');

const repository = require(path.resolve('src/repository'));
const AWS = require('aws-sdk');

const { aws, cdn } = require(path.resolve('config'));
const s3 = new AWS.S3();
const { MarketType } = require(path.resolve('src/lib/Enums'));

let users;

const pushUsers = async (user) => {
  users.push(user);
};

const csvGetRecord = (text) => {
  const ret = ['']; let i = 0; let p = '';
  let s = true;
  for (let l in text) {
    l = text[l];
    if (l === '"') {
      s = !s;
      if (p === '"') {
        ret[i] += '"';
        l = '-';
      } else if (p === '') { l = '-'; }
    } else if (s && l === ',') { l = ret[++i] = ''; } else { ret[i] += l; }
    p = l;
  }
  return ret;
};

const getDataFromCsv = async (params) => {
  const csv = await new Promise((resolve, reject) => {
    s3.getObject(params, async (err, data) => {
      const dataRes = await data.Body.toString('UTF-8').split('\n');
      if (err) { reject(err); }

      resolve(dataRes);
    });
  });
  return csv;
};

const loopUserRows = async (rows, header) => {
  let index = 0;
  for (const row of rows) {
    index++;
    if (row !== '') {
      const columns = csvGetRecord(row);
      const user = {};

      await columns.forEach((column, colIndex) => {
        user[header[colIndex]] = column.trim();
      });


      await pushUsers(user);
    }
  }
};

module.exports = async (_, { path }) => {
  users = [];

  const params = {
    Bucket: aws.user_bucket,
    Key: path,
  };

  const csv = await getDataFromCsv(params)
    .then((res) => res)
    .catch((err) => err);

  let [header, ...rows] = csv;
  header = header.trim().split(',');

  await loopUserRows(rows, header);

  return await new Promise((resolve, reject) => promise.map(users, async (user, index) => {
    user.roles = ['USER'];
    user.phone = user.phonenumber;

    user.address = {
      street: user.address,
      city: user.city,
      region: user.region,
      country: user.country,
      zipCode: user.zipCode,
    };

    user.location = {
      latitude: user.latitude,
      longitude: user.longitude,
    };

    user.settings = {
      language: user.language,
      currency: user.currency,
      measureSystem: user.measureSystem,
    };

    const {
      id,
      latitude,
      longitude,
      city,
      region,
      country,
      zipCode,
      language,
      currency,
      measureSystem,
      phonenumber,
      ...properties
    } = user;

    if (id) {
      user = { _id: id, ...properties };
    } else {
      user = { _id: uuid(), ...properties };
    }

    if (user.brandName) {
      user.brand = await new Promise((resolve) => repository.brand.findByName(user.brandName).then((res) => {
        resolve(res.id || res);
      }).catch((err) => {
        resolve(null);
      }));
    }

    if (user.photo) {
      if (user.photo.includes('.jpg')
                    || user.photo.includes('.jpeg')
                    || user.photo.includes('.png')) {
        const assetData = {
          name: user.name,
          photo: user.photo,
          owner: user._id,
          path: `${user.name}/Logo/${user.photo}`,
          url: aws.vendor_bucket,
        };
        user.photo = await new Promise((resolve, reject) => repository.asset.createFromCSVForUsers(assetData).then((res) => {
          resolve(user.photo = res || res.id);
        }).catch((err) => {
          resolve(null);
        }));
      }
    }

    user.customCarrier = await new Promise((resolve) => repository.customCarrier.findOrCreate(user.customCarrier_name).then((res) => {
      resolve(res._id);
    }).catch(() => {
      resolve(null);
    }));

    let organization;
    const addressId = uuid();

    organization = {
      owner: user._id,
      customCarrier: user.customCarrier,
      address: {
        isDeliveryAvailable: true,
        street: user.ship_from_address_street,
        city: user.ship_from_address_city,
        region: user.ship_from_address_region,
        country: user.ship_from_address_country,
        zipCode: user.ship_from_address_zipcode,
        addressId: `adr_${addressId}`,
      },
      billingAddress: {
        isDeliveryAvailable: true,
        street: user.billing_address_street,
        city: user.billing_address_city,
        region: user.billing_address_region,
        country: user.billing_address_country,
        zipCode: user.billing_address_zipcode,
        addressId: `adr_${addressId}`,
      },
      // workInMarketTypes: user.workInMarketTypes
    };

    organization = await new Promise((resolve) => repository.organization.findOrCreate(organization).then((res) => {
      resolve(res._id);
    }).catch(() => {
      resolve(null);
    }));

    return repository.user.createFromCsv(user).then((res) => res).catch((err) => console.log('user importing error', err));
  }).then((res) => {
    resolve(res.filter((item) => item));
  }).catch((err) => {
    reject(err);
  })).then((res) => res).catch((err) => err);
};
