const path = require('path');
const { gql } = require('apollo-server');

const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));

const calculateDelivery = require('./resolvers/calculateDelivery');
const calculateDeliveryRates = require('./resolvers/calculateDeliveryRates');
const estimateRate = require('./resolvers/estimateRate');
const createLabel = require('./resolvers/createLabel');

const schema = gql`
  type DeliveryRate {
    id: ID!
    carrier: Carrier
    service: String
    deliveryDays: Int
    deliveryDateGuaranteed: Boolean
    rate_id: String
    shipmentId: String
    deliveryAddress: DeliveryAddress!,      
    estimatedDeliveryDate: Date
    # carrierDeliveryDays: String
    amount(currency: Currency): AmountOfMoney!
  }

  type DeliveryOptionCalculation {
    carrier: Carrier!
    deliveryDays: Int!
    estimatedDeliveryDate: Date!
    carrierDeliveryDays: String!
    amount(currency: Currency): AmountOfMoney!
  }

  type DeliveryCalculation  {
    cheaper: DeliveryOptionCalculation
    faster: DeliveryOptionCalculation
    others: [DeliveryOptionCalculation]!
  }
  

  type Dimensions {
    width: Float!
    height: Float!
    length: Float!
    unit: SizeUnitSystem!
  }

  input DimensionsInput {
    width: Float!
    height: Float!
    length: Float!
    unit: SizeUnitSystem!
  }

  input DeliveryPackageInput {
    weight: WeightInput!
    dimensions: DimensionsInput!
  }

  input DeliveryRateItemInput {
    price: Float!
    currency: Currency!
    description: String!
    quantity: Int!
  }

  input DeliveryRateCalculationInput {
    seller: UserInput
    buyer: UserInput!
    shipTo: DeliveryAddressInput!
    shipFrom: DeliveryAddressInput
    product: DeliveryRateItemInput!
    package: DeliveryPackageInput!
  }

  type DeliveryRateItem {
    price(currency: Currency): AmountOfMoney!
    description: String!
    quantity: Int!
  }

  type DeliveryInfo {
    carrierId: String!
    shippingAmount(currency: Currency): AmountOfMoney!
    insuranceAmount(currency: Currency): AmountOfMoney
    confirmationAmount(currency: Currency): AmountOfMoney
    shipDate: Date!
    deliveryDays: Int
    carrierDeliveryDays: String
    carrierName: String!
    carrierCode: String!
    serviceType: String!
    serviceCode: String!
  }

  type ShipAddress {
    description: String,
    street: String,
    city: String,
    region: String,
    country: String,
    zipCode: String
  }

  type EstimateRate {
    id: String!
    shipFrom: ShipAddress!
    shipTo: ShipAddress!
    product: DeliveryRateItem!
    deliveryInfo: DeliveryInfo!
  }

  type LabelInfo {
    id: String!
    label_id: String!
    shipment_id: String!
    carrier_id: String!
    service_code: String!
    label_download: LabelURLs!
  }

  type LabelURLs {
    pdf: String!
    png: String!
    zpl: String!
    href: String!
  }

  extend type Mutation {
    estimateRate(option: DeliveryRateCalculationInput): [EstimateRate]!
    createLabel(rateid: String!): LabelInfo!
    calculateDeliveryRates(product: ID!, quantity: Int!, deliveryAddress: ID!, isWholeSale: Boolean = false, metricUnit: ProductMetricUnit): [DeliveryRate]! 
    calculateDelivery(product: ID!, deliveryAddress: ID!): DeliveryCalculation! @deprecated(reason: "Use 'calculateDeliveryRates' instead")
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Mutation: {
    calculateDelivery,
    calculateDeliveryRates,
    estimateRate,
    createLabel,
  },
  DeliveryOptionCalculation: {
    carrier: async (calculation, args, { dataSources: { repository } }) => repository.carrier.getById(calculation.carrier),
    amount: async ({ totalAmount, currency }, args) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ currencyAmount: totalAmount, currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
  },
  DeliveryRate: {
    carrier: async (calculation, args, { dataSources: { repository } }) => repository.carrier.getById(calculation.carrier),
    amount: async ({ amount, currency }, args) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: amount, currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
    deliveryAddress: async (calculation, args, { dataSources: { repository } }) => repository.deliveryAddress.getById(calculation.deliveryAddress),  
  },
  EstimateRate: {
    product: async({ product }, args, { dataSources: { repository } }) => {
      console.log("product currency =>", product);
      let amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: product.price, currency: product.currency });
      if (args.currency && args.currency !== currency) {
        amountOfMoney = CurrencyService.exchange(amountOfMoney, args.currency);
      }
      console.log("asdfasdfasdfasd => ", amountOfMoney);
      return {
        ...product,
        price: amountOfMoney
      }
    },
    deliveryInfo: async({ deliveryInfo }, args, { dataSources: { repository } }) => {
      return {
        ...deliveryInfo,
        shippingAmount: CurrencyFactory.getAmountOfMoney({ centsAmount: deliveryInfo.shippingAmount.amount, currency: deliveryInfo.shippingAmount.currency }),
        insuranceAmount: CurrencyFactory.getAmountOfMoney({ centsAmount: deliveryInfo.insuranceAmount.amount, currency: deliveryInfo.insuranceAmount.currency }),
        confirmationAmount: CurrencyFactory.getAmountOfMoney({ centsAmount: deliveryInfo.confirmationAmount.amount, currency: deliveryInfo.confirmationAmount.currency }),
      }
    }
  }
};
