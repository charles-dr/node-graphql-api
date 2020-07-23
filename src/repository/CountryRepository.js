
class CountryRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getAll() {
    return this.model.find().sort({ name: 1 });
  }

  async loadList(ids) {
    return this.model.find({ _id: { $in: ids } });
  }

  async saveCountry(data){
    let dataModel=await this.model.findOne({ _id: data.countryCode })
    if(dataModel){
      dataModel.geonameId=data.geonameId
      dataModel.save()
    }else{
      return this.model.save({
        _id: data.countryCode,
        name: data.countryName,
        currency: data.currencyCode
      })
    }
  }
}

module.exports = CountryRepository;
