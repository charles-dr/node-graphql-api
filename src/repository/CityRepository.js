const uuid = require('uuid/v4');
const AWS = require('aws-sdk');
const path = require('path');

const { aws } = require(path.resolve('config'));

const s3 = new AWS.S3();
const { CityService } = require(path.resolve('src/lib/CityService'));

class CityRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ _id: id });
  }

  async findByName(name) {
    let cityModel = await this.model.findOne({ name });
    if (cityModel) {
      return cityModel;
    }

    const city = await CityService.getCity(name);
    cityModel = await this.model.findOne({ name: city.name });
    if (cityModel) {
      return cityModel;
    }

    const photo = await CityService.loadPhoto(city.photo);

    const id = uuid();

    return Promise.all([
      s3.upload({
        Bucket: aws.app_bucket,
        Key: `cities/${id}.${photo.type}`,
        Body: photo.buffer,
      }).promise(),
      this.model.create({
        _id: id,
        name: city.name,
        location: city.location,
        photo: `/cities/${id}.${photo.type}`,
      })]).then(([, savedCity]) => savedCity);
  }

  async getAll() {
    return this.model.find().sort({ name: 1 });
  }

  async get(query) {
    return this.model.find(query).sort({ name: 1 });
  }

  async getByRegions(regionIds) {
    return this.model.find({ region: {$in: regionIds} }).sort({ name: 1 });
  }
}

module.exports = CityRepository;
