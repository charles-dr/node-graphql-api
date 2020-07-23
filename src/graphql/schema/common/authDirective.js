/* eslint-disable no-param-reassign */

const { defaultFieldResolver } = require('graphql');
const { SchemaDirectiveVisitor } = require('graphql-tools');
const { AuthenticationError, ForbiddenError } = require('apollo-server');

const { gql } = require('apollo-server');

const schema = gql`
    directive @auth(
        requires: Role = ADMIN,
    ) on OBJECT | FIELD_DEFINITION

    enum Role {
        ADMIN
        USER
    }
`;

module.exports.typeDefs = [schema];

class AuthDirective extends SchemaDirectiveVisitor {
  visitObject(type) {
    type._requiredAuthRole = this.args.requires;
    this.ensureFieldsWrapped(type);
  }

  visitFieldDefinition(field, details) {
    field._requiredAuthRole = this.args.requires;
    this.ensureFieldsWrapped(details.objectType, field);
  }


  // eslint-disable-next-line class-methods-use-this
  ensureFieldsWrapped(objectType, field = null) {
    // Mark the GraphQLObjectType object to avoid re-wrapping:
    // if (objectType._authFieldsWrapped) return;
    // objectType._authFieldsWrapped = true;
    const fields = objectType.getFields();

    Object.keys(fields).filter(fieldName => (field && field.name === fieldName) || (!field)).forEach((fieldName) => {
      const field = fields[fieldName];
      const role = field._requiredAuthRole || objectType._requiredAuthRole;
      field.description = `Allows: authorized ${role.toLowerCase()} \n\n ${field.description || ''}`;

      const { resolve = defaultFieldResolver } = field;

      field.resolve = async function (...args) {
        // Get the required Role from the field first, falling back
        // to the objectType if no Role is required by the field:
        const requiredRole = field._requiredAuthRole
            || objectType._requiredAuthRole;

        if (!requiredRole) {
          return resolve.apply(this, args);
        }

        const { user } = args[2];
        if (!user) {
          throw new AuthenticationError('UNAUTHENTICATED');
        }

        if (!user.roles.includes(requiredRole)) {
          throw new ForbiddenError('Administrator permission required!');
        }

        return resolve.apply(this, args);
      };
    });
  }
}

module.exports.auth = AuthDirective;
