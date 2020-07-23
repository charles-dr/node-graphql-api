const { gql } = require('apollo-server');
const uuid = require('uuid/v4');
const ShippingAddressModel = require('../../../../model/ShippingAddressModel');

const schema = gql`
    type ShippingAddress {
        id: ID!
        label: String!
        street: [String!]!
        phone: String!
        region: [String!]!
        zipCode: String!
        isDeliveryAvailable: Boolean,
        isDefault:Boolean
    }

    input ShippingAddressInput {
        label: String!
        street:[String!]!
        phone: String!
        region: [String!]!
        zipCode: String!
        isDefault:Boolean
    }
    
    input UpdateShippingAddressInput {
        id: ID!
        label: String!
        street: [String!]!
        phone: String!
        region: [String!]!
        zipCode: String!
        isDefault:Boolean
    }

    extend type Query {
        """
        Allows: authorized user
        """
        shippingAddresses: [ShippingAddress]! @auth(requires: USER)

    }

    extend type Mutation {
        """
        Allows: authorized user
        """
        addShippingAddress(data: ShippingAddressInput!) : ShippingAddress! @auth(requires: USER)
        """
        Allows: authorized user
        """
        updateShippingAddress(id: ID!, data: UpdateShippingAddressInput!) : ShippingAddress! @auth(requires: USER)
        """
        Allows: authorized user
        """
        deleteShippingAddress(id: ID!) : Boolean! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    shippingAddresses: async (_, args, { dataSources: { repository }, user }) => repository.shippingAddress.getAll({ owner: user.id }),
  },
  Mutation: {
    addShippingAddress: async (_, args, { dataSources: { repository }, user }) => {
      args.data.owner = user.id;
      return repository.shippingAddress.create(args.data);
    },
    deleteShippingAddress: async (_, args, { dataSources: { repository } }) => {
      return repository.shippingAddress.remove(args.id);
    },
    /* updateShippingAddress,
    deleteShipppingAddress */
  },
};
