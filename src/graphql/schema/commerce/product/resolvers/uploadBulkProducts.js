const path = require('path');
const uuid = require('uuid/v4');
const promise = require('bluebird');
const lodash = require('lodash');

const repository = require(path.resolve('src/repository'));
const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));

const AWS = require('aws-sdk');

const { aws } = require(path.resolve('config'));
const { InventoryLogType, MarketType } = require(path.resolve('src/lib/Enums'));

const s3 = new AWS.S3();

let shippingBoxesCollection;
let organizationsCollection;
let products;
let failedParsing;
let failedProducts;
let brands;
let assetsS3bucket;
let variationsCollection;
let variationArr;

const getDataFromCsv = async (params) => {
  const csv = await new Promise((resolve, reject) => {
    s3.getObject(params, async (err, data) => {
      if (err) { reject(err); }

      const dataRes = await data.Body.toString('UTF-8');
      resolve(dataRes);
    });
  });
  return csv;
};

const addProduct = async (product, index) => {
  product.category = product.shoclef_category_id;
  product.description = product.description;
  product.title = product.title;

  product.seller = await new Promise((resolve) => repository.user.findByEmail(product.email).then((res) => {
    resolve(product.seller = res._id || res);
  }).catch(() => {
    resolve(null);
  }));

  product.assets = JSON.parse(product.assets);

  const path = `/${product.username}/Product Images/`;
  product.assets = await promise.map(product.assets, (asset) => {
    if (asset !== '') {
      const assetData = {
        owner: product.seller,
        path: asset,
        // path: `${path}${asset}`,
        photo: asset,
        name: product.username,
        // url: aws.vendor_bucket,
        bucket: assetsS3bucket,
      };

      return repository.asset.createAssetFromCSVForProducts(assetData).then((res) => res.id || res);
    }
  }).then((res) => res)
    .catch((err) => console.log(err));

  const price = parseFloat(product.price);
  const oldPrice = product.oldPrice ? parseFloat(product.oldPrice) : parseFloat(product.price);

  product.price = CurrencyFactory.getAmountOfMoney({ currencyAmount: price, currency: product.currency }).getCentsAmount();
  product.oldPrice = product.oldPrice ? CurrencyFactory.getAmountOfMoney({ currencyAmount: oldPrice, currency: product.currency }).getCentsAmount() : null;
  if (product.oldPrice == 0) { product.oldPrice = null; }
  product.assets = product.assets.filter((asset) => asset) || [];
  product.isDeleted = (product.isDeleted === 'true');

  product.brand = await new Promise((resolve) => repository.brand.findByName(product.brand_name).then((res) => {
    resolve(res.id || res);
  }).catch(() => {
    resolve(null);
  }));

  if (!product.freeDeliveryTo) {
    delete product.freeDeliveryTo;
  } else {
    product.freeDeliveryTo = product.freeDeliveryTo.split(",");
  }

  product.weight = {
    // value: parseInt(product.weightValue),
    value: parseFloat(product.weightValue || 1.0),
    unit: product.weightUnit,
  };

  const shippingBoxProperties = {
    label: product.shippingBoxName || 'medium',
    owner: product.seller,
    // width: parseInt(product.shippingBoxWidth),
    // height: parseInt(product.shippingBoxHeight),
    // length: parseInt(product.shippingBoxLength),
    width: parseFloat(product.shippingBoxWidth || 1.0),
    height: parseFloat(product.shippingBoxHeight || 1.0),
    length: parseFloat(product.shippingBoxLength || 1.0),
    weight: product.weight.value,
    unit: product.weight.unit,
    unitWeight: product.unitWeight || 'OUNCE',
  };

  product.shippingBox = await new Promise((resolve) => repository.shippingBox.findByOwnerAndSize({
    label: shippingBoxProperties.label,
    owner: shippingBoxProperties.owner,
    width: shippingBoxProperties.width,
    height: shippingBoxProperties.height,
    length: shippingBoxProperties.length,
    weight: shippingBoxProperties.weight,
  }).then((res) => {
    resolve(res._id || res);
  }).catch((err) => {
    resolve(null);
  }));

  product.customCarrier = await new Promise((resolve) => repository.customCarrier.getById(product.customCarrier).then(async (res) => {
    if (res == null) {
      await repository.customCarrier.create({
        _id: product.customCarrier,
        name: 'Custom Courier',
      }).then((res) => {
        resolve(res.id);
      }).catch(() => {
        resolve(null);
      });
    }
    resolve(product.customCarrier = res._id || res);
  }).catch(() => {
    resolve(null);
  }));

  product.customCarrierValue = CurrencyFactory.getAmountOfMoney({ currencyAmount: parseFloat(product.customCarrierValue), currency: product.currency }).getCentsAmount();

  const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: product.price, currency: product.currency });
  product.sortPrice = await CurrencyService.exchange(amountOfMoney, 'USD').then((exchangedMoney) => exchangedMoney.getCentsAmount());

  const {
    _id,
    assets0,
    assets1,
    assets2,
    assets3,
    assets4,
    assets5,
    weightValue,
    shippingBoxName,
    shippingBoxWidth,
    shippingBoxHeight,
    shippingBoxLength,
    unit,
    weightUnit,
    ...finalProduct
  } = product;

  // if (id) {
  //     product = { _id: id, ...finalProduct };
  // } else {
  //     product = { ...finalProduct };
  //     product["_id"] = uuid();
  // }
  const existing = await repository.product.findDuplicate(product);
  if (existing) {
    product = { _id: existing._id, ...finalProduct };
  } else if (_id) {
    product = { _id, ...finalProduct };
  } else {
    product = { ...finalProduct };
    product._id = uuid();
  }

  try {
    product.attrs = [];

    const attributeNames = product.attributeNames.split(';');
    const attributeValues = product.attributeValues.split(';');

    for (let i = 0; i < attributeValues.length; i++) {
      const oneValue = attributeValues[i].split('|');
      const attributeData = {};

      if (oneValue.length < 3) continue;

      attributeData.variation = [];
      for (let j = 0; j < oneValue.length - 4; j++) {
        attributeData.variation.push({
          name: attributeNames[j],
          value: oneValue[j],
        });
      }
      attributeData.price = parseFloat(oneValue[oneValue.length - 2]);
      attributeData.price = CurrencyFactory.getAmountOfMoney({ currencyAmount: attributeData.price, currency: product.currency }).getCentsAmount();
      attributeData.oldPrice = parseFloat(oneValue[oneValue.length - 3]);
      attributeData.oldPrice = product.oldPrice != 0 ? CurrencyFactory.getAmountOfMoney({ currencyAmount: attributeData.oldPrice, currency: product.currency }).getCentsAmount() : null;
      attributeData.quantity = oneValue[oneValue.length - 4];
      attributeData.currency = product.currency;
      attributeData.productId = product._id;
      attributeData.sku = uuid();

      const assetData = {
        owner: product.seller,
        path: oneValue[oneValue.length - 1],
        photo: oneValue[oneValue.length - 1],
        name: product.username,
        bucket: assetsS3bucket,
      };

      attributeData.asset = await new Promise((resolve) => 
        repository.asset.createAssetFromCSVForProducts(assetData)
          .then((res) => {
            resolve(product.seller = res._id || res);
          }).catch(() => {
            resolve(null);
          })
      );

      product.attrs.push(attributeData);
    }

    product.attrs = await promise.map(product.attrs, (attr) => repository.productAttributes.findOrCreate(attr).then((res) => res.id).catch((err) => console.log(err)));
  } catch (error) {
    console.log('error occured while add variationPrice', error);
  }

  const inventoryLog = {
    _id: uuid(),
    product: product._id,
    shift: product.quantity,
    type: InventoryLogType.USER_ACTION,
  };

  return await repository.product.createFromCSV(product).then((res) => {
    repository.productInventoryLog.add(inventoryLog);
    return res;
  }).catch((err) => {
    // console.log(err);
    const error = errorFormater(err, (index + 2));
    pushFailedProducts({ csvPosition: (index + 2), error, ...product });
  });
};

const errorFormater = (err, row) => {
  if (err.errors) {
    const error = err.errors;
    let parsedError = [];

    if (error.price) {
      parsedError = error.price.message;
    } else if (error.customCarrierValue) {
      parsedError = error.customCarrierValue.message;
    } else if (error.currency) {
      parsedError = error.customCarricurrencyValue.message;
    } else if (error.customCarrier) {
      parsedError = error.customCarrier.message;
    } else if (error.shippingBox) {
      parsedError = error.shippingBox.message;
    } else if (error.brand) {
      parsedError = error.brand.message;
    } else if (error.seller) {
      parsedError = error.seller.message;
    } else if (error.description) {
      parsedError = error.description.message;
    } else if (error.category) {
      parsedError = error.category.message;
    } else if (error.message) {
      parsedError = error;
    } else {
      parsedError = 'no mesage';
    }

    parsedError += ` on row ${row}`;

    return parsedError;
  }
  let parsedError = [];
  if (err.errmsg) {
    parsedError = err.errmsg;
  } else {
    parsedError = 'unknown error';
  }
  parsedError += ` on row ${row}`;

  return parsedError;
};

const pushFailedProducts = async (failedProduct) => {
  failedProducts.push(failedProduct);
};

const pushProducts = async (product) => {
  products.push(product);
};

const pushShippingBoxes = async (shippingBoxes) => {
  shippingBoxesCollection.push(shippingBoxes);
};

const pushOrganizations = async (organization) => {
  if (organization) { organizationsCollection.push(organization); }
};

const pushBrands = async (brand) => {
  brands.push(brand);
};

const pushVariations = async (variations) => {
  if (!variations) { return null; }

  try {
    const attributeNames = variations.names.split('|');
    const attributeValues = variations.values.split('|');
    if (attributeNames.length == attributeValues.length) {
      for (let i = 0; i < attributeNames.length; i++) {
        const values = attributeValues[i].split('-');
        for (let j = 0; j < values.length; j++) {
          variationsCollection.push({
            attributeName: attributeNames[i],
            attributeValue: values[j],
          });
        }
      }
    }
  } catch (error) {
    return null;
  }
};

const csvGetRecord = (text) => {
  let p = ''; let row = ['']; const ret = [row]; let i = 0; let r = 0; let s = !0; let
    l;
  for (l of text) {
    if (l === '"') {
      if (s && l === p) row[i] += l;
      s = !s;
    } else if (l === ',' && s) l = row[++i] = '';
    else if (l === '\n' && s) {
      if (p === '\r') row[i] = row[i].slice(0, -1);
      row = ret[++r] = [l = '']; i = 0;
    } else row[i] += l;
    p = l;
  }
  return ret;
};

const loopProductRows = async (csv) => {
  const csvRows = csvGetRecord(csv);
  const [header, ...rows] = csvRows;

  let index = 0;
  for (const row of rows) {
    if (row.length <= 1) { continue; }

    index++;
    const product = {};

    await row.forEach((column, colIndex) => {
      product[header[colIndex]] = column.trim();
    });

    const email = product.email ? product.email.toLowerCase() : 'null';
    product.seller = await new Promise((resolve) => repository.user.findByEmail(email).then((res) => {
      resolve(res._id || res);
    }).catch((err) => {
      failedParsing.push(`While reading the csv could not find seller ${index}`);
      resolve(undefined);
    }));

    product.weight = {
      value: parseFloat(product.weightValue || 1.0),
      unit: product.weightUnit,
    };

    let shippingBoxProperties;
    let organization;
    let variations;

    try {
      if (!product.seller) { throw err; }

      shippingBoxProperties = {
        label: product.shippingBoxName || 'medium',
        owner: product.seller,
        // width: parseInt(product.shippingBoxWidth),
        // height: parseInt(product.shippingBoxHeight),
        // length: parseInt(product.shippingBoxLength),
        // weight: parseInt(product.weight.value),
        width: parseFloat(product.shippingBoxWidth || 1.0),
        height: parseFloat(product.shippingBoxHeight || 1.0),
        length: parseFloat(product.shippingBoxLength || 1.0),
        weight: product.weight.value,
        unit: product.unit,
        unitWeight: product.unitWeight || 'OUNCE',
      };
    } catch (error) {
      failedParsing.push("Couldn't parse shippingBox properties");
    }

    try {
      organization = {
        owner: product.seller,
        customCarrier: product.customCarrier,
      };
    } catch (error) {
      organization = null;
    }

    await pushShippingBoxes(shippingBoxProperties);
    await pushBrands(product.brand_name);
    await pushProducts(product);
    await pushOrganizations(organization);
  }
};

module.exports = async (_, { fileName, bucket }) => {
  shippingBoxesCollection = [];
  organizationsCollection = [];
  products = [];
  failedParsing = [];
  failedProducts = [];
  brands = [];
  assetsS3bucket = bucket;

  const params = {
    Bucket: aws.user_bucket,
    Key: fileName,
  };

  const csv = await getDataFromCsv(params)
    .then((res) => res)
    .catch((err) => err);

  await loopProductRows(csv);

  const uniqueShippingBoxes = lodash.uniqWith(shippingBoxesCollection, lodash.isEqual);
  const uniqueBrands = lodash.uniqWith(brands, lodash.isEqual);
  const uniqueOrganizations = lodash.uniqWith(organizationsCollection, lodash.isEqual);
  // const uniqueProductVariations = lodash.uniqWith(variationsCollection, lodash.isEqual);

  const brandPromises = await uniqueBrands.map((item) => new Promise((resolve) => repository.brand.findOrCreate({ name: item })
    .then((res) => {
      resolve(res._id);
    })
    .catch(() => {
      // failedParsing.push("Couldn't add/parse brand");
      resolve(null);
    })));

  // variationArr = await uniqueProductVariations.map(item => new Promise((resolve) => {
  //     return repository.productVariation.findOrAdd(item)
  //         .then(res => resolve(res))
  //         .catch(() => {
  //             failedParsing.push("Couldn't add/parse variation");
  //             resolve(null);
  //         })
  // })).filter(variation => variation)
  // .reduce((variationArr, variation) => {
  //     variationArr[variation.attributeName] = variation.id;
  // });

  const shippingBoxesPromises = await uniqueShippingBoxes.map((item) => new Promise((resolve) => repository.shippingBox.findOrAdd({
    label: item.label,
    owner: item.owner,
    width: item.width || 1.0,
    height: item.height || 1.0,
    length: item.length || 1.0,
    weight: item.weight || 1.0,
    unit: item.unit,
    unitWeight: item.unitWeight,
  }).then((res) => {
    resolve(res._id);
  }).catch((err) => {
    failedParsing.push("couldn't add/parse shippingbox");
    resolve(null);
  })));

  await uniqueOrganizations.map((item) => repository.organization.getByUser(item.owner)
    .then((organization) => {
      if (!organization) {
        return repository.user.getById(item.owner);
      }
    }).then((user) => {
      if (user) {
        return repository.organization.create({
          address: user.address,
          billingAddress: user.address,
          owner: user._id,
          customCarrier: item.customCarrier,
          carriers: null,
          workInMarketTypes: MarketType.toList(),
        });
      }
    }).catch((err) => console.log(err)));

  return Promise.all(shippingBoxesPromises, brandPromises).then(async () => {
    if (failedParsing.length === 0) {
      const productPromises = await promise.map(products, async (product, index) => await addProduct(product, index)).then((res) => res.filter((item) => item))
        .catch((err) => console.log(err));

      return productPromises;
    }
    throw failedParsing;
  }).then((res) => {
    const failed = failedProducts.map((prod) => {
      rolleBackAssets(prod.assets);
      return prod.csvPosition;
    });

    const error = failedProducts.map((prod) => prod.error);

    failedProducts = [];
    products = [];
    return {
      success: res,
      failedProducts: { row: [...failed], errors: error },
      totalProducts: res.length + failed.length,
      uploaded: res.length,
      failed: failed.length,
    };
  }).then((res) => {
    repository.asset.updateStatusByPath(fileName, 'UPLOADED');
    return res;
  })
    .catch(() => {
      const failedParsingConst = failedParsing.map((prod) => prod.trim());
      failedParsing = [];
      return {
        success: [],
        failedProducts: { row: [-1], errors: [...failedParsingConst] },
        totalProducts: -1,
        uploaded: 0,
        failed: -1,
      };
    });
};

const rolleBackAssets = async (assets) => {
  assets.forEach((asset) => {
    if (asset) {
      repository.asset.deleteAsset({ id: asset }).then((res) => res).catch((err) => err);
    }
  });
};
