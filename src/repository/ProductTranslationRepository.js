const uuid = require('uuid/v4');

class ProductTranslationRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id, isDeleted: false });
  }

  async getAll() {
    return this.model.find({});
  }

  async getByIds(ids) {
    return this.model.find({ _id: ids, isDeleted: false });
  }

  async getByProduct(productId) {
    return this.model.findOne({ product: productId });
  }

  async addNewProduct(data) {
    const newProduct = new this.model({ ...data, _id: uuid() });
    return newProduct.save();
  }

  async updateProduct(productId, data) {
    const product = await this.getByProduct(productId);
    if (!product) return this.addNewProduct({ product: productId, ...data });

    product.title = data.title || product.title;
    product.description = data.description || product.description;

    // eslint-disable-next-line no-return-await
    return await product.save();
  }
}

module.exports = ProductTranslationRepository;
