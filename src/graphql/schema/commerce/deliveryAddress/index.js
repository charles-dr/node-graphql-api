const { gql } = require('apollo-server');

const addDeliveryAddress = require('./resolvers/addDeliveryAddress');
const updateDeliveryAddress = require('./resolvers/updateDeliveryAddress');
const deleteDeliveryAddress = require('./resolvers/deleteDeliveryAddress');
const addBillingAddress = require('./resolvers/addBillingAddress');
const updateBillingAddress = require('./resolvers/updateBillingAddress');
const deleteBillingAddress = require('./resolvers/deleteBillingAddress');

const schema = gql`
    type DeliveryAddress implements AddressInterface {
        id: ID!
        label: String
        street: String
        city: String
        region: Region
        country: Country!
        phone:String
        zipCode: String
        isDeliveryAvailable: Boolean!
        addressId: String
        description: String
        shippingAddress: String
        email:String
        isDefault: Boolean
    }

    input DeliveryAddressInput {
        label: String
        street: String
        city: String
        region: ID!
        country: ID!
        zipCode: String
        phone:String
        email:String
        description: String
        isDefault: Boolean = false
    }
    
    input BillingAddressInput {
        label: String
        street: String
        city: String
        region: ID
        country: ID
        zipCode: String
        description: String
        shippingAddress: String
    }

    input UpdateDeliveryAddressInput {
        label: String
        street: String
        city: String
        region: ID!
        country: ID!
        zipCode: String
        description: String
        addressId: String
        shippingAddress: String
        phone: String
        isDefault: Boolean = false
    }

    extend type Query {
        """
            Allows: authorized user
        """
        deliveryAddresses: [DeliveryAddress]! @auth(requires: USER)
        """
            Allows: authorized user
        """
        billingAddresses: [DeliveryAddress]! @auth(requires: USER)
    }

    extend type Mutation {
        """
            Allows: authorized user
        """
        addDeliveryAddress(data: DeliveryAddressInput!) : DeliveryAddress! @auth(requires: USER)
        """
            Allows: authorized user
        """
        updateDeliveryAddress(id: ID!, data: UpdateDeliveryAddressInput!) : DeliveryAddress! @auth(requires: USER)
        """
            Allows: authorized user
        """
        deleteDeliveryAddress(id: ID!) : Boolean! @auth(requires: USER)
        """
            Allows: authorized user
        """
        addBillingAddress(data: BillingAddressInput!) : DeliveryAddress! @auth(requires: USER)
        """
            Allows: authorized user
        """
        updateBillingAddress(id: ID!, data: UpdateDeliveryAddressInput!) : DeliveryAddress! @auth(requires: USER)
        """
            Allows: authorized user
        """
        deleteBillingAddress(id: ID!) : Boolean! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    deliveryAddresses: async (_, args, { dataSources: { repository }, user }) => repository.deliveryAddress.getAll({ owner: user.id }),
    billingAddresses: async (_, args, { dataSources: { repository }, user }) => repository.billingAddress.getAll({ owner: user.id }),
  },
  Mutation: {
    addDeliveryAddress,
    deleteDeliveryAddress,
    updateDeliveryAddress,
    addBillingAddress,
    updateBillingAddress,
    deleteBillingAddress,
  },
  DeliveryAddress: {
    addressId: async ({ address: { addressId } }) => addressId,
    id: async (deliveryAddress ) => deliveryAddress._id,
    street: async ({ address: { street } }) => street,
    city: async ({ address: { city } }) => city,
    region: async ({ address: { region } }, _, { dataSources: { repository } }) => repository.region.getById(region),
    country: async ({ address: { country } }, _, { dataSources: { repository } }) => repository.country.getById(country),
    zipCode: async ({ address: { zipCode } }) => zipCode,
    isDeliveryAvailable: async ({ address: { isDeliveryAvailable } }) => isDeliveryAvailable,
    description: async ({ address: { description } }) => description,
  },
};
