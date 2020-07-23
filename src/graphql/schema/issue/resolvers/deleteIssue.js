const path = require('path');
const { Validator } = require('node-input-validator');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

const { IssueStatus } = require(path.resolve('src/lib/Enums'))


module.exports = async (_, { id }, { dataSources: { repository }, user}) => {
  const v = new Validator({ id }, {
    id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
  })

  v.addPostRule(async pv => {
    await Promise.all([
      repository.issue.getById(pv.inputs.id),
    ])
      .then(([issueById]) => {
        if (!issueById) {
          pv.error('id', 'custom', `Issue with id "${pv.inputs.id}" does not exist!`);
        } else if (issueById.issuer !== user.id) {
          pv.error('permission', 'custom', 'You have no delete permission!');
        }
      })
  })

  return v.check()
    .then(async (matched) => {
      if (!matched) throw errorHandler.build(v.errors);
      return repository.issue.getById(id);
    })
    .then((issue) => {
      issue.isDeleted = true;
      return issue.save();
    })
    .then(issue => issue.isDeleted)
    .catch(error => {
      throw errorHandler.build([error]);
    })
}