const path = require('path');
const { gql } = require('apollo-server');

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { DeliveryOrderStatus } = require(path.resolve('src/lib/Enums'));

const updateDeliveryOrder = require('./resolvers/updateDeliveryOrder');
const updateDeliveryOrderForAdmin = require('./resolvers/updateDeliveryOrderForAdmin');

const schema = gql`
    enum DeliveryOrderStatus {
        ${DeliveryOrderStatus.toGQL()}
    }

    type DeliveryOrderLog {
        id: ID!
        occurredAt: Date!
        address: Address
        description: String!
    }

    type carrierType {
      id: ID!
      name: String
    }

    type DeliveryOrder {
      id: ID!
      trackingNumber: String
      status: DeliveryOrderStatus!
      estimatedDeliveryDate: Date
      deliveryPrice(currency: Currency): AmountOfMoney!
      deliveryAddress: DeliveryAddress!
      proofPhoto: [Asset]
      carrier: carrierType
      item: String
    }

    input UpdateDeliveryOrderInput {
      trackingNumber: String
      carrier: String!
      estimatedDeliveryDate: Date
      proofPhoto: ID,
      saleOrderId: ID!
      status: DeliveryOrderStatus
    }

    extend type Mutation {
      """
          Allows: authorized user & user must be a seller
      """
      updateDeliveryOrder(ids: [ID!]!, data: UpdateDeliveryOrderInput!): [DeliveryOrder!] @auth(requires: USER)
      updateDeliveryOrderForAdmin(id: ID!, data: UpdateDeliveryOrderInput!): DeliveryOrder! @auth(requires: ADMIN)
  }
`;
// 10-29
// type DeliveryOrder {
//   id: ID!
//   trackingNumber: String!
//   status: DeliveryOrderStatus!
//   estimatedDeliveryDate: Date
//   deliveryPrice: AmountOfMoney!
//   deliveryAddress: DeliveryAddress!
//   logs: [DeliveryOrderLog]!
//   proofPhoto: [Asset]
// }

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Mutation: {
    updateDeliveryOrder,
    updateDeliveryOrderForAdmin,
  },
  DeliveryOrder: {
    deliveryPrice: async ({ deliveryPrice, currency }, args) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: deliveryPrice, currency: currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
    proofPhoto: async ({ proofPhoto }, _, { dataSources: { repository } }) => (
      proofPhoto ? repository.asset.getById(proofPhoto) : null
    ),
    deliveryAddress: async ({ deliveryAddress, deliveryAddressInfo }, _, { dataSources: { repository } }) => (
      deliveryAddressInfo || repository.deliveryAddress.getById(deliveryAddress, true)
    ),
    carrier: async ({ carrier }, _, { dataSources: { repository } }) => {
      let carrierInfo = await repository.customCarrier.getById(carrier);
      if (!carrierInfo) {
        carrierInfo = await repository.carrier.getById(carrier);
      }
      return {
        id: carrierInfo.id,
        name: carrierInfo.name,
      };
    }
  },
};
