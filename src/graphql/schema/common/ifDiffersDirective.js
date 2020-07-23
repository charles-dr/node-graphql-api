/* eslint-disable no-param-reassign */

const { defaultFieldResolver } = require('graphql');
const { SchemaDirectiveVisitor } = require('graphql-tools');
const filter = require('lodash/filter');
const { AuthenticationError, ForbiddenError, ValidationError } = require('apollo-server');

const { gql } = require('apollo-server');

const schema = gql`
    directive @ifDiffers(
        key: String!,
        value: Any!
    ) on FIELD_DEFINITION | INPUT_FIELD_DEFINITION
`;

module.exports.typeDefs = [schema];

class IfDiffersDirective extends SchemaDirectiveVisitor {

  visitFieldDefinition(field, details) {
    field._conditionalKey = this.args.key;
    field._conditionalValue = this.args.value;
    this.ensureFieldsWrapped(details.objectType);
  }

  visitInputFieldDefinition(field, details) {
    field._conditionalKey = this.args.key;
    field._conditionalValue = this.args.value;
    // console.log('[Visit]', field);
    this.wrapInputField(details.objectType, field);
  }

  // eslint-disable-next-line class-methods-use-this
  ensureFieldsWrapped(objectType) {
    // Mark the GraphQLObjectType object to avoid re-wrapping:
    if (objectType._conditionalFieldsWrapped) return;
    objectType._conditionalFieldsWrapped = true;

    const fields = objectType.getFields();

    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      const { resolve = defaultFieldResolver } = field;

      field.resolve = async function (...args) {
        // Get the required Role from the field first, falling back
        // to the objectType if no Role is required by the field:
        const requiredRole = field._requiredAuthRole
            || objectType._requiredAuthRole;
        const conKey = field._conditionalKey;
        const conValue = field._conditionalValue;
        if (!conKey && !conValue) return resolve.apply(this, args);

        const parent = args[0];
        const resolveField = async () => {
          return resolve.apply(this, args);
        }
        const fieldValue = await resolveField();

        if (!fieldValue && parent[conKey] !== conValue) {
          console.log('[Directive][Before Throw]', args[3].parentType, parent._id);
          throw new Error(`${args[3].parentType}.${args[3].fieldName} can't be null!`);
        }

        return fieldValue;
      };
    });
  }

  // eslint-disable-next-line class-methods-use-this
  wrapInputField(objectType, field) {
    const fields = objectType.getFields();
    Object.keys(fields).filter(fieldName => fieldName === field.name).forEach(fieldName => {
      const field = fields[fieldName];
      const conKey = field._conditionalKey;
      const conValue = field._conditionalValue;
      
      if (conKey && conValue) {
        field.description = `Required if ${conKey} differs from ${conValue}. \n\n ${field.description || ''}`;
      }

      const mutationsForInput = this.getMutations(({args = []}) => {
        return args.find(arg => arg && arg.type && arg.type.ofType === objectType);
      });
      mutationsForInput.forEach(mutation => {
        const { resolve = defaultFieldResolver } = mutation;
        mutation.resolve = async function(...args) {
          const [targetArg] = mutation.args.filter(arg => arg && arg.type && arg.type.toString().includes(objectType.name))
          const params = args[1][targetArg.name];
          if (params[conKey] !== conValue && params[fieldName] === undefined) {
            throw new ValidationError(`Field ${objectType.name}.${fieldName} is required when "${conKey}" differs from ${conValue}!`);
          }
          return resolve.apply(this, args)
        }
      });
    })
  }

  getMutations(predicate = null) {
    if (!this._mutations) {
        this._mutations = Object.values(
            this.schema.getMutationType().getFields()
        );
    }
    if (!predicate) {
        return this._mutations || [];
    }
    return filter(this._mutations, predicate);
  }
}

module.exports.ifDiffers = IfDiffersDirective;
