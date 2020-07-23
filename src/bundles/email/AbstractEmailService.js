/* eslint-disable class-methods-use-this */

const path = require('path');

const { ApolloError } = require('apollo-server');

const logger = require(path.resolve('config/logger'));
const requireDir = require('require-dir');

const { awsSMTP } = require(path.resolve('config'));
const templates = requireDir('./view');

const nodemailer = require("nodemailer");

class AbstractEmailService {
  getTemplate(name) {
    const template = templates[name];

    if (!template) {
      throw new ApolloError('Template does not exists', 400, { invalidArgs: 'template' });
    }

    return template;
  }

  getParams(args) {
    const params = {
      from: args.data ? awsSMTP.fromOther : awsSMTP.from,
      to: args.user.email,
      subject: args.template.subject,
      html: args.template.build({ code: args.code, user: args.user, ...args }),
      // Custom headers for configuration set and message tags.
      headers: awsSMTP.headers,
    };

    return params;
  }

  async send(params) {
    logger.debug(`[EMAIL]: try send email ${JSON.stringify(params)}`);
    let transporter = nodemailer.createTransport(awsSMTP.config);
    try {
      const res = await transporter.sendMail(params);
      return res;
    } catch (error) {
      console.log("send email error =>", JSON.stringify(error));
    }
  }
}

module.exports = AbstractEmailService;
