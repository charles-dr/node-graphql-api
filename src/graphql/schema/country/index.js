const { gql } = require('apollo-server');
let axios= require('axios');

const schema = gql`
    type Country {
      id: ID!
      name(locale: Locale): String
      geonameId: String
      currency: Currency!
    }

    extend type Query {
        countriesGeonames: [Country]!
        countries: [Country]!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    countries(_, args, { dataSources: { repository } }) {
      let service=args.service||'none'
      if(service=='geonames'){
        axios.get('http://api.geonames.org/countryInfoJSON?username=linqun').then(({data})=>{
          if(data.geonames){
            data.geonames.forEach(item=>{
              repository.saveCountry(item)
            })
          }
          return repository.country.getAll();
        }).catch(e=>{
          console.log('geonames error', e)
          return repository.country.getAll();
        })
      }
      else{
        return repository.country.getAll();
      }
    },
    countriesGeonames(_, args, { dataSources: { repository } }) {
      return axios.get('http://api.geonames.org/countryInfoJSON?username=linqun').then(({data})=>{
          if(data.geonames){
            data.geonames.forEach(item=>{
              repository.country.saveCountry(item)
            })
          }
          return repository.country.getAll();
        }).catch(e=>{
          console.log('geonames error', e)
          return repository.country.getAll();
        })
    },
  },
};
