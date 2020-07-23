/* eslint-disable no-param-reassign */
const path = require('path');
const { gql } = require('apollo-server');

const generateDiscountCode = require('./resolvers/generateDiscountCode');

const { DiscountValueType, DiscountPrivileges } = require(path.resolve('src/lib/Enums'));

const schema = gql`

    enum DiscountValueType {
      ${DiscountValueType.toGQL()}
    }
    enum DiscountPrivileges {
      ${DiscountPrivileges.toGQL()}
    }
    type Discount {
      id:ID!
      user: User
      code: String
      value_type: DiscountValueType
      products:[Product]
      product_categories:ProductCategory
      all_product:Boolean
      brands:[Brand]
      brand_categories:BrandCategory
      amount: Int!
      privilege: DiscountPrivileges
      startAt:Date
      endAt:Date
      isActive:Boolean
    }

    extend type Mutation {
        generateDiscountCode(
            value_type: DiscountValueType!
            products:[ID]
            product_categories:[ID]
            all_product:Boolean
            brands:[ID]
            brand_categories:[ID]
            amount: Int!
            privilege: DiscountPrivileges!
            startAt:Date!
            endAt:Date!
        ) : Discount! @auth(requires: USER)
        
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {

  },
  Mutation: {
    generateDiscountCode,
  },
};
