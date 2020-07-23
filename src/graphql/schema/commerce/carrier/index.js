const { gql } = require('apollo-server');
const deasync = require('deasync');
const afterShip = require('../../../../AfterShip');

const schema = gql`
    type Carrier {
        id: ID!
        name: String!
        carrierId: String!
        workInCountries: [Country]!
        slug: String,
        phone: String,
        homepage: String
        apiProvider: String
    }

    extend type Query {
        """
        Allows: authorized user
        Fetch carriers which User can use in his country
        """
        carriers: [Carrier]! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    async carriers(_, args, { dataSources: { repository }, user }) {
      console.log('user.address.country', user.address.country);
      let carriers = '';
      if (user.address.country === 'CN') {
        repository.carrier.getAll({ apiProvider: 'AfterShip' })
          .then((data) => {
            carriers = data;
          });
        while ((carriers === '')) {
          deasync.runLoopOnce();
        }
        if (carriers.length === 0) {
          // todo add carriers from after ship
          const afterShipCarriers = afterShip.allCouriers();
          // console.log('afterShipCarriers',afterShipCarriers);
          if (afterShipCarriers.state !== -1) {
            // eslint-disable-next-line no-restricted-syntax
            for (const item of afterShipCarriers.couriers) {
              const insertItem = {
                _id: `after-ship-${item.slug}`,
                name: item.name,
                workInCountries: ['CN'],
                carrierId: item.slug,
                phone: item.phone,
                homepage: item.web_url,
                slug: item.slug,
                apiProvider: 'AfterShip',
              };
              // eslint-disable-next-line no-await-in-loop
              await repository.carrier.addItem(insertItem);

            }
            carriers = '';
            repository.carrier.getAll({ apiProvider: 'AfterShip' })
              .then((data) => {
                carriers = data;
              });
            while ((carriers === '')) {
              deasync.runLoopOnce();
            }
          }
        }
        return carriers;
      }
      repository.carrier.getAll({ workInCountries: user.address.country })
        .then((data) => {
          carriers = data;
        });
      while ((carriers === '')) {
        deasync.runLoopOnce();
      }
      // console.log('carriers', carriers);
      return carriers;
    },
  },
  Carrier: {
    workInCountries({ workInCountries }, args, { dataSources: { repository } }) {
      return repository.country.loadList(workInCountries);
    },
  },
};
