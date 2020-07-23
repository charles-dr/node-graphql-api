const path = require('path');
const { gql } = require('apollo-server');
const { UserInputError, ApolloError } = require('apollo-server');

const paymentBundle = require(path.resolve('src/bundles/payment'));
const { PaymentMethodProviders } = require(path.resolve('src/lib/Enums'));

const schema = gql`
    enum PaymentProvider { ${Object.keys(paymentBundle.providers).join(' ')} }
    enum PaymentMethodProvider {
      ${PaymentMethodProviders.toGQL()}
    }

    ${Object.keys(paymentBundle.providers)
    .map((name) => paymentBundle.providers[name].getGQLSchema())
    .join('\n')}

    """ Payment Method (eWallet or credit cart) related with user"""
    type PaymentMethod {
        id: ID!
        provider: PaymentProvider!
        providerIdentity: String!
        name: String!
        """ Date when this method will be inactive"""
        expiredAt: Date!
        card: CardDetails!
    }

    type CardDetails {
      id: ID!
      number: String!
      exp_month: Int!
      exp_year: Int!
      cvc: String!
      name: String
    }

    type DeleteResult {
      success: Boolean!
    }

    input NewCardDetailsInput {
      number: String!
      exp_month: Int!
      exp_year: Int!
      cvc: String!
      name: String
    }

    input UpdateCardDetailsInput {
      id: String!
      exp_month: Int!
      exp_year: Int!
      name: String!
    }

    input PaymentMethodExpiresInput {
        year: Int!
        month: Int!
    }

    input PaymentMethodInput {
        ${Object.keys(paymentBundle.providers).map((name) => `${name}: ${paymentBundle.providers[name].getGQLInputName()}`).join(', ')}
    }

    input NewCardInput {
      details: NewCardDetailsInput!
      provider: PaymentMethodProvider!
    }

    input UpdateCardInput {
      details: UpdateCardDetailsInput!
      provider: PaymentMethodProvider!
    }

    input deletePaymentMethodInput {
      id: String!
      provider: PaymentMethodProvider!
    }

    extend type Query {
        """Allows: authorized user"""
        paymentMethods: [PaymentMethod]!  @auth(requires: USER)
        availablePaymentMethods: [PaymentProvider]!
    }

    extend type Mutation {
        """Allows: authorized user"""
        addPaymentMethod(data: PaymentMethodInput!): PaymentMethod!  @auth(requires: USER)
        addNewCard(data: NewCardInput!): PaymentMethod!  @auth(requires: USER)
        updateCardDetails(data: UpdateCardInput!): PaymentMethod!  @auth(requires: USER)
        deletePaymentMethod(data: deletePaymentMethodInput!): DeleteResult!  @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    async availablePaymentMethods() {
      return Object.keys(paymentBundle.providers);
    },
    async paymentMethods(_, args, { dataSources: { repository }, user }) {
      return repository.paymentMethod.getActiveMethods(user);
    },

  },
  Mutation: {
    async addPaymentMethod(_, { data }, context) {
      const providers = Object.keys(data).filter((name) => data[name]);
      if (providers.length > 1) {
        throw new UserInputError('You can add only one provider in one moment');
      }
      const providerName = providers[0];
      const providerData = data[providerName];

      return paymentBundle.providers[providerName].addMethod(providerData, context);
    },
    async addNewCard(_, { data }, context) {
      return paymentBundle.providers[data.provider].addNewCard(data.details, context);
    },
    async updateCardDetails(_, { data }, context) {
      return paymentBundle.providers[data.provider].updateCard(data.details, context);
    },
    async deletePaymentMethod(_, { data }, context) {
      return paymentBundle.providers[data.provider].deletePaymentMethod(data.id, context);
    },
  },
  PaymentMethod: {
    provider: ({ provider }) => {
      const found = Object.keys(paymentBundle.providers)
        .filter((name) => paymentBundle.providers[name].getName() === provider);
      if (found.length === 0) {
        throw new ApolloError(`Wrong provider in DB ${provider}`);
      }
      return found[0];
    },
    card: async ({ card }, _, { dataSources: { repository } }) => (
      repository.cardDetails.getById(card)
    ),
  },
};
