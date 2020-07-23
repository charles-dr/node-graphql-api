const { GraphQLScalarType } = require('graphql')
const { Kind } = require('graphql/language')
const { gql } = require('apollo-server');

const schema = gql`
  scalar Any
`;

const JSONParse = (value) => {
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
}

const parseValue = (value) => {
  if (typeof value === 'object') return value;
  else if (typeof value === 'string' && value === 'null') return null;
  else if (typeof value === 'string') {
    return JSONParse(value);
  } else {
    return null;
  }
}

const resolvers = {
  Any: new GraphQLScalarType({
    name: 'Any',
    description: 'Arbitrary object. or Boolean, Int, Float, String',
    parseValue,
    serialize: parseValue,
    parseLiteral: (ast) => {
      switch (ast.kind) {
        case Kind.STRING: return JSONParse(ast.value)
        case Kind.OBJECT: throw new Error(`Not sure what to do with OBJECT for ObjectScalarType`)
        default: return null
      }
    }
  })
};



module.exports.typeDefs = [schema];
module.exports.resolvers = resolvers;


