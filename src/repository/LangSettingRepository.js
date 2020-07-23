const uuid = require('uuid/v4');

class LangSettingRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    const langSetting = new this.model({
      ...data,
      _id: uuid()
    });
    return langSetting.save();
  }

  async load() {
    return this.model.findOne({});
  }

  async update(data) {
    let langSetting = await this.load();
    if (!langSetting) {
      return this.create(data);
    } else {
      langSetting = {...langSetting, ...data};
      return langSetting.save();
    }
  }

  async deleteAll() {
    return this.model.deleteMany();
  }  
}

module.exports = LangSettingRepository;
