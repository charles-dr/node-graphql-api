const uuid = require('uuid/v4');

class VariationTranslationRepository {
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

  async getByAttribute(attrId) {
    return this.model.findOne({ attribute: attrId });
  }

  async addNewAttribute(data) {
    const newAttr = new this.model({ ...data, _id: uuid() });
    return newAttr.save();
  }

  async updateAttribute(attrId, data) {
    const attribute = await this.getByAttribute(attrId);
    if (!attribute) return this.addNewProduct({ attribute: attrId, ...data });

    attribute.variations = data.variations || attribute.variations;

    // eslint-disable-next-line no-return-await
    return await attribute.save();
  }
}

module.exports = VariationTranslationRepository;
