/**
 * @description search similar products based on hashtags. sort by sold
 */

const path = require("path");
const { Validator } = require("node-input-validator");

const ProductService = require(path.resolve("src/lib/ProductService"));
const { ErrorHandler } = require(path.resolve("src/lib/ErrorHandler"));
const errorHandler = new ErrorHandler();

module.exports = (
  _,
  { productId, limit = 10 },
  { dataSources: { repository } }
) => {
  const validator = new Validator(
    { productId },
    {
      productId: "required",
    }
  );

  return validator.check()
    .then((matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
      return repository.product.getById(productId);
    })
    .then(async (product) => {
      const category = await repository.productCategory.getById(
        product.category
      );
      let categories = [];
      if (category && category.parents.filter((it) => it).length) {
        categories = await ProductService.familyCategories([
          category.parents.filter((it) => it).pop(),
        ]);
      }
      
      return repository.product.model.find(
        { isDeleted: false, category: { $in: categories } },
        null,
        { skip: 0, limit, sort: { sold: -1 } }
      );
    })
    .catch((error) => {
      throw errorHandler.build([error]);
    });
};
