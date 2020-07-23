/**
 * @name correctProductCategoryHierarchy
 * @description correct the hierarchy("parents" field) of the product categories.
 * 
 */
const path = require('path');
const uuid = require('uuid/v4');
const { Validator } = require('node-input-validator');
const { ApolloError } = require('apollo-server');
const logger = require(path.resolve('config/logger'));

const { ErrorHandler } = require(path.resolve("src/lib/ErrorHandler"));
const errorHandler = new ErrorHandler();

const activity = {
  fixParentHierarchy: (row, rows) => {
    if (!row.parent) return [null];

    const [parent] = rows.filter(item => item._id === row.parent);
    if (!parent) return [null];
    else {
      return [...(activity.fixParentHierarchy(parent, rows)), row.parent];
    }
  },
};

module.exports = async (_, __, { dataSources: { repository }, user }) => {

  return repository.productCategory.load({}, {skip: 0})
    .then(async (categories) => {
      return Promise.all(categories.map(category => {
        category.parents = activity.fixParentHierarchy(category, categories);
        return category.save();
      }));
    })
    .then(() => true)
    .catch(error => {
      logger.info(`[correctProductCategoryHierarchy][Error] ${error.message}`);
      return false;
    })
}
