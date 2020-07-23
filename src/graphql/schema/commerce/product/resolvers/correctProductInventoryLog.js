/** 
 * @name correctProductInventoryLog
 * @description manipulates the database by async the collections of products, productattributes, productinventorylog to initiate new concept.
 *  - clear all the productinventorylogs at the first turn.
 *  - for the product, calculate the total quantity from attributes or self, and stores it to productinventorylogs.
 *  - at the same time, for the attributes, productinventorylogs should be created.
 * 
*/

const path = require('path');
const uuid = require('uuid/v4');
const { Validator } = require("node-input-validator");
const { ApolloError } = require('apollo-server');
const { InventoryLogType } = require(path.resolve('src/lib/Enums'));
const logger = require(path.resolve('config/logger'));

const { ErrorHandler } = require(path.resolve("src/lib/ErrorHandler"));
const errorHandler = new ErrorHandler();

const activity = {
  processBatch: async ({ skip, limit }, repository) => {
    logger.info(`[correctProductInventoryLog][Batch] ${skip} - ${skip + limit} [Processing...]`);
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
        logger.info(`[correctProductInventoryLog][Batch] ${skip} - ${skip + limit} [Done]`);
        return batchResult
      })
  },
  processProduct: async (product, repository) => {
    const errors = [];
    return repository.productAttributes.getByIds(product.attrs)
      .then(async attributes => {
        if (attributes && attributes.length) {
          product.quantity = attributes.reduce((sum, item) => sum + item.quantity, 0) || 0;

          await Promise.all(attributes.map(attribute => {
            return activity.checkNcreateInventoryLog({
              product: attribute.productId,
              productAttribute: attribute.id,
              quantity: attribute.quantity,
              type: InventoryLogType.USER_ACTION 
            }, repository)
            .catch(error => {
              errors.push(`${error.message} for attribute ${attribute.id}`);
            })
          }))
        }
        
        await activity.checkNcreateInventoryLog({
          product: product.id,
          productAttribute: null,
          quantity: product.quantity,
        }, repository)
          .catch(error => {
            errors.push(`${error.message} for product`);
          });
        return product.save();
      })
      .then(product => errors)
      // .catch(error => {
      //   console.log('[Product] error', product.id);
      //   errors.push(error.message);
      //   return errors;
      // });
  },
  checkNcreateInventoryLog: async ({ product, productAttribute, quantity, type = InventoryLogType.USER_ACTION }, repository) => {
    return repository.productInventoryLog.deleteAll({
      product, productAttribute, type,
    })
      .then(() => repository.productInventoryLog.add({
        _id: uuid(),
        product, productAttribute, type,
        shift: quantity,
      }))
      .catch(error => {
        throw new Error("Error while creating inventory log!");
      })
  }
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
      skip === 0 ? repository.productInventoryLog.deleteAll() : null,
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
