const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
const uuid = require('uuid/v4');

class AccessTokenRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ _id: id });
  }

  async findByUserId(userID) {
    return this.model.findOne({ user: userID });
  }

  async findAllByUserId(userID) {
    return this.model.find({ user: userID });
  }

  async create(user, data = {}) {
    const defaultExpiration = '999 years';
    return this.findByUserId(user._id)
      .then((token) => {
        if (token) {
          this.findAllByUserId(user._id).then((tokens) => {
            tokens.forEach(item => {
              if (item._id !== token._id)
                item.remove();
            });
          });
          token.ip = data.ip || null;

          if (data.userAgent) {
            token.fingerprint = data.userAgent.replace(/\s/g, '').toLowerCase();
          }

          return token.save()
            .then(() => jsonwebtoken.sign({
              id: token._id,
              user_id: user._id,
            }, token.secret, { expiresIn: data.expiresIn || defaultExpiration }));

        } else {
          const newToken = new this.model({
            _id: uuid(),
            user: user._id,
            ip: data.ip || null,
            secret: bcrypt.genSaltSync(64),
          });

          if (data.userAgent) {
            newToken.fingerprint = data.userAgent.replace(/\s/g, '').toLowerCase();
          }

          return newToken.save()
            .then(() => jsonwebtoken.sign({
              id: newToken._id,
              user_id: user._id,
            }, newToken.secret, { expiresIn: data.expiresIn || defaultExpiration }));
        }
      });
  }
}

module.exports = AccessTokenRepository;
