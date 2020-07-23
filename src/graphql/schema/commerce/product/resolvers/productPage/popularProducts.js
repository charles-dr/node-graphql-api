/**
 * @description search similar products based on category. sort by featured.
 */
const path = require("path");
const { Validator } = require("node-input-validator");

const ProductService = require(path.resolve('src/lib/ProductService'));
const { ErrorHandler } = require(path.resolve("src/lib/ErrorHandler"));
const errorHandler = new ErrorHandler();

const activity = {
  generateAggregateModel: (categoryId) => {
    console.log('[CategoryId]', categoryId);
    if (categoryId) {
      return [
        { $match: { isDeleted: false, quantity: { $gt: 0 } } },
        {
          $addFields: {
            sameCategory: {
              $cond: [
                {
                  $eq: [
                    "$category",
                    categoryId,
                  ]
                },
                0,
                1
              ]
            }
          }
        },
        {
          $sort: {
            sameCategory: 1,
            isFeatured: 1
          },
        },
      ];
    } else {

    }
  },
};

module.exports = (_, { productId, limit = 10 }, { dataSources: { repository } }) => {
  const validator = new Validator(
    { productId },
    {
      productId: "required",
    },
  );

  return validator.check()
    .then(matched => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
      return repository.product.getById(productId);
    })
    .then(async product => {
      const category = await repository.productCategory.getById(product.category);
      let categories = [];
      if (category && category.parents.filter(it => it).length) {
        categories = await ProductService.familyCategories([category.parents.filter(it => it).pop()]);
      }

      // return repository.product.model.aggregate(activity.generateAggregateModel(product.category)) //, { "allowDiskUse" : true })
      return repository.product.model.find(
        { isDeleted: false, category: { $in: categories } },
        null,
        { skip: 0, limit, sort: { isFeatured: -1 } }
      );
    })
    .catch((error) => {
      throw errorHandler.build([error]);
    });
}
