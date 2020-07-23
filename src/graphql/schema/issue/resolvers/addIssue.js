const path = require('path');
const { Validator } = require('node-input-validator');

const { EmailService } = require(path.resolve('src/bundles/email'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

const { IssueStatus } = require(path.resolve('src/lib/Enums'))


module.exports = async (_, { data }, { dataSources: { repository }, user}) => {
  const v = new Validator(data, {
    name: "required",
    phone: "required",
    // email: ['required', ['regex', /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/]],
    urgency: "required",
    category: "required",
    message: "required",
  })

  v.addPostRule(async pv => {
    await repository.issueCategory.getById(pv.inputs.category)
      .then(categoryById => {
        if (!categoryById) pv.error('category', 'custom', `Category with id ${pv.inputs.category} does not exist!`);
      })
  })

  return v.check()
    .then(async (matched) => {
      if (!matched) throw errorHandler.build(v.errors);
    })
    .then(() => {
      const issue = {
        issuer: user ? user.id : null,
        name: data.name,
        phone: data.phone,
        urgency: data.urgency,
        email: data.email || null,
        message: data.message,
        category: data.category,
        note: "",
        status: IssueStatus.CREATED,
        attachments: data.attachments,
      }
      return repository.issue.create(issue);
    })
    .then(async (issue) => {
      await EmailService.notifyNewIssue(issue);
      return issue;
    })
    .catch(error => {
      throw errorHandler.build([error]);
    })
}