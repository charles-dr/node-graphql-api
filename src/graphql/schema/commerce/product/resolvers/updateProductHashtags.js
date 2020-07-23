/** 
 * @name updateProductHashtags
 * @description manipulates the database with hashtags of products. Hashtags are generated from:
 *  - product - title, description
 *  - category - name and hashtags
 *  - brand - name
 * 
*/

const path = require('path');
const uuid = require('uuid/v4');
const { Validator } = require("node-input-validator");
const { ApolloError } = require('apollo-server');
const PythonService = require(path.resolve('src/lib/PythonService'));
const logger = require(path.resolve('config/logger'));

const { ErrorHandler } = require(path.resolve("src/lib/ErrorHandler"));
const errorHandler = new ErrorHandler();

const activity = {
  processBatch: async ({ skip, limit }, repository) => {
    logger.info(`[updateProductHashtags][Batch] ${skip} - ${skip + limit} [Processing...]`);
    const batchResult = {
      total: 0,
      success: 0,
      failure: 0,
      errors: []
    }

    return repository.product.get({
        filter: {}, sort: { feature: 'CREATED_AT', type: 'ASC' }, page: {skip, limit}
      })
      .then(products => {
        batchResult.total = products.length;
        return Promise.all(products.map(product => activity.processProduct(product, repository)
        .then(errors => {
          if (errors && errors.length) {
            batchResult.errors.push({
              id: product.id,
              errors: errors,
            })
            batchResult.failure ++;
          } else {
            batchResult.success ++;
          }
        })))
      })
      .then(() => {        
        logger.info(`[updateProductHashtags][Batch] ${skip} - ${skip + limit} [Done]`);
        return batchResult
      })
  },
  processProduct: async (product, repository) => {
    const errors = [];
    return await Promise.all([
      repository.productCategory.getById(product.category),
      repository.brand.getById(product.brand),
    ])
      .then(async ([category, brand]) => {
        const query_string = activity.composeSourceString({ product, category, brand });

        return PythonService.extractKeyword(query_string)
      })
      .then(keywords => {
        product.hashtags = keywords;
        return product.save();
      })
      .then(product => errors)
      .catch(error => {
        console.log('[error]', error.message)
        errors.push(`${error.message}`);
        return errors;
      });
  },
  composeSourceString: ({ product, category, brand }) => {
    const DELIMITER = ',';
    let strArr = [];
    if (product) strArr.push([product.title, product.description].join(DELIMITER));

    if (category) strArr.push([...category.hashtags, category.name].join(DELIMITER));
    
    if (brand) strArr.push([brand.hashtags, ...brand.name].join(DELIMITER));

    return strArr.join(DELIMITER);
  },
}

module.exports = async (_, { skip, limit }, { dataSources: { repository }, user}) => {
  const validator = new Validator(
    { skip, limit },
    {
      limit: "required|min:100"
    }
  );

  const result = {
    totalProducts: 0,
    processed: 0,
    success: 0,
    failure: 0,
    errors: [],
  };

  const batch = 100;
  return validator.check()
    .then(matched => {
      if (!matched) throw errorHandler.build(validator.errors);
    })
    .then(() => Promise.all([
      repository.product.getTotal({}),
    ]))
    .then(async ([totalProducts]) => {
      result.totalProducts = totalProducts;
      result.processed = skip + limit;
      const batches = Math.ceil(limit / batch);

      for (let i = 0; i < batches; i ++) {
        await activity.processBatch({
          skip: skip + i * batch,
          limit: batch,
        }, repository)
        .then((batchResult) => {
          result.processed = skip + batchResult.total;
          result.success += batchResult.success;
          result.failure += batchResult.failure;
          result.errors = result.errors.concat(batchResult.errors)
        });
      }
    })
    .then(() => result)
    .catch(error => {
      console.log('[error]', error);
      throw new ApolloError(`Failed to update Product. Original error: ${error.message}`, 400);
    });
}
