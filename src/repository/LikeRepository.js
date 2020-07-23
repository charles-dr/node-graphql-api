class LikeRepository {
  constructor(model) {
    this.model = model;
  }

  async load(tag, userId) {
    return this.model.findOne({ tag, user: userId });
  }

  async toggleLike(tag, userId) {
    return this.model.findOneAndRemove({ tag, user: userId })
      .then((like) => (like || this.model.create({ tag, user: userId })));
  }

  async getLikesCount(tag) {
    return this.model.countDocuments({ tag });
  }
}

module.exports = LikeRepository;
