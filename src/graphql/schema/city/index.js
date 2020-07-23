const path = require('path');
const { gql } = require('apollo-server');

const { cdn } = require(path.resolve('config'));

const schema = gql`

    type City {
        id: ID!
        name: String!
        location: LatLng!
        region: Region
        photo: String!
    }

    input CityInput {
        name: String!
        region: String!
    }

    input CityFilterInput {
      region: String
      country: String
    }

    extend type Query {
        city(name: String!): City!
        cities(filter: CityFilterInput): [City]!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    city(_, { name }, { dataSources: { repository } }) {
      return repository.city.findByName(name);
    },
    cities: async (_, args, { dataSources: { repository } }) => {
      let regionIds = [];
      if (args.filter.country) {
        const regions = await repository.region.getAll({ country: args.filter.country });
        regionIds = regions.map(region => region._id);
      }
      console.log("cities filter",args.filter)
      if (args.filter.region) {
        regionIds.push(args.filter.region);
      }
      
      let query = {};
      if (regionIds.length > 0) {
        query = { region: {$in:regionIds} };
      }
      console.log("regionIds",regionIds,query)
      return repository.city.get(query);
    },
  },
  City: {
    region(city, __, { dataSources: { repository } }) {
      return repository.region.getById(city.region);
    },
    photo(city) {
      return cdn.appAssets + city.photo;
    },
  },
};
