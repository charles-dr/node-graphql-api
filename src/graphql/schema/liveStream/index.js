const { merge } = require('lodash');

const { typeDefs: experienceTypeDefs, resolvers: experienceResolvers } = require('./liveStreamExperience');
const { typeDefs: categoryTypeDefs, resolvers: categoryResolvers } = require('./liveStreamCategory');
const { typeDefs: livestreamTypeDefs, resolvers: livestreamResolvers } = require('./liveStream');


const typeDefs = [].concat(
  experienceTypeDefs,
  categoryTypeDefs,
  livestreamTypeDefs,
);

const resolvers = merge(
  experienceResolvers,
  categoryResolvers,
  livestreamResolvers,
);

module.exports = {
  typeDefs,
  resolvers,
};
