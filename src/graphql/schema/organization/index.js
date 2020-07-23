const { gql } = require('apollo-server');
const path = require('path');

const { MarketType } = require(path.resolve('src/lib/Enums'));

const updateOrganization = require('./resolvers/updateOrganization');

const schema = gql`
  enum MarketType {
    ${MarketType.toGQL()}
  }

  type Organization {
    id: ID!
    carriers: [Carrier!]
    address: VerifiedAddress!
    billingAddress: VerifiedAddress
    payoutInfo: String
    returnPolicy: String
    workInMarketTypes: [MarketType]!
    rating: Float!
    customCarrier: CustomCarrier
  }

  input OrganizationInput {
    carriers: [ID]
    address: AddressInput
    billingAddress: AddressInput
    payoutInfo: String
    returnPolicy: String
    workInMarketTypes: [MarketType]
    customCarrier: String
  }

  extend type Query {
    """Allows: authorized user"""
    organization: Organization @auth(requires: USER)
  }

  extend type Mutation {
    """Allows: authorized user"""
    updateOrganization(data: OrganizationInput): Organization! @auth(requires: USER)
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    organization(_, args, { user, dataSources: { repository } }) {
      return repository.organization.getByUser(user.id);
    },
  },
  Mutation: {
    updateOrganization,
  },
  Organization: {
    carriers({ carriers }, args, { dataSources: { repository } }) {
      return repository.carrier.loadList(carriers);
    },
    customCarrier({ customCarrier }, args, { dataSources: { repository } }) {
      return repository.customCarrier.getById(customCarrier);
    },
    workInMarketTypes(organization) {
      if (!organization.workInMarketTypes) {
        return [];
      }
      return organization.workInMarketTypes;
    },
    rating: async (organization, _, { dataSources: { repository } }) => repository.rating.getAverage(organization.getTagName()),
  },
};
