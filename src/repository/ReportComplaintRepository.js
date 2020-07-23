const uuid = require('uuid/v4');

class ReportComplaintRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    const reportComplain = new this.model({
      _id: uuid(),
      ...data,
    });

    return reportComplain.save();
  }
}

module.exports = ReportComplaintRepository;
