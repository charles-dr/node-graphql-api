
class DiscountRepository {
    constructor(model) {
      this.model = model;
    }
  
    async getById(id) {
      return this.model.findOne({ _id: id });
    }    
    
    async getItemByCode(code) {
      return this.model.findOne({code});
    }
  
    async getByIds(ids) {
      return this.model.find({ _id: ids });
    }
  
    async create(data) {
      const item = new this.model(data);
      return item.save();
    }
  }
  
  module.exports = DiscountRepository;