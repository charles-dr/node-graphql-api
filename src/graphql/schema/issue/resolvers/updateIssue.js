const path = require('path');
const { Validator } = require('node-input-validator');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

const { IssueStatus } = require(path.resolve('src/lib/Enums'))


module.exports = async (_, { id, data }, { dataSources: { repository }, user}) => {
  const v = new Validator({ id, ...data }, {
    id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
  })

  v.addPostRule(async pv => {
    await Promise.all([
      repository.issue.getById(pv.inputs.id),
      pv.inputs.category ? repository.issueCategory.getById() : null,
    ])
      .then(([issueById, category]) => {
        if (!issueById) {
          pv.error('id', 'custom', `Issue with id "${pv.inputs.id}" does not exist!`);
        } 
        // else if (issueById.issuer !== user.id) {
        //   pv.error('permission', 'custom', 'You have no update permission!');
        // }
        if (pv.inputs.category && !category) {
          pv.error('category', 'custom', `Category with id "${pv.inputs.id}" does not exist!`)
        }
      })
  })

  return v.check()
    .then(async (matched) => {
      if (!matched) throw errorHandler.build(v.errors);
      return repository.issue.getById(id);
    })
    .then((issue) => {
      const keysToUpdate = ['name', 'phone', 'email', 'urgency', 'message', 'category', 'attachments'];
      keysToUpdate.forEach(key => {
        if (data[key] !== undefined) issue[key] = data[key];
      })
      return issue.save();
    })
    .catch(error => {
      throw errorHandler.build([error]);
    })
}