const { gql } = require('apollo-server');
let axios=require("axios")
const schema = gql`
    type Region {
      id: ID!
      name: String
      geonameId: String
    }

    input RegionFilter {
      countryId: ID!
    }

    extend type Query {
      regions(filter: RegionFilter!): [Region]!
      regionsGeonames(geonameId:String!): [Region]!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    regions: (_, args, { dataSources: { repository } }) => {
      const query = { country: args.filter.countryId };
      return repository.region.getAll(query);
    },
    regionsGeonames: (_, args, { dataSources: { repository } }) => {
      let geonameId=args.geonameId
      return axios.get(`http://api.geonames.org/childrenJSON?geonameId=${geonameId}&username=linqun`).then(({data})=>{
        let res=[]
        if(data.geonames){
          data.geonames.forEach(item=>{
            res.push({
              id:item.countryCode+'-'+item.adminCode1,
              name: item.name,
              geonameId: item.geonameId
            })
          })
        }
        return res
      }).catch(e =>{return []});
    },
  },
};
