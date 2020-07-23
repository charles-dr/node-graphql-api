/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
const graphql = require('graphql');

class ProviderAbstract {
  getName() {
    throw Error('Implement "getName" method');
  }

  getGQLInputName() {
    return `${this.getName()}PaymentInput`;
  }

  getGQLSchema() {
    throw Error('Implement "getGQLSchema" method');
  }

  addMethod(args, context) {
    throw Error('Implement "addMethod" method');
  }
}

module.exports = ProviderAbstract;
