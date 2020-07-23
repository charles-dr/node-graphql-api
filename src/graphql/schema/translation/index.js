const { merge } = require('lodash');

const { typeDefs: phraseCategoryTypeDefs, resolvers: phraseCategoryResolvers } = require('./phraseCategory');
const { typeDefs: phraseTypeDefs, resolvers: phraseResolvers } = require('./phrase');
const { typeDefs: translateTypeDefs, resolvers: translateResolvers } = require('./translate');
const { typeDefs: langSettingTypeDefs, resolvers: langSettingResolvers } = require('./setting');


const typeDefs = [].concat(
	phraseCategoryTypeDefs,
	phraseTypeDefs,
	translateTypeDefs,
	langSettingTypeDefs,
);

const resolvers = merge(
	phraseCategoryResolvers,
	phraseResolvers,
	translateResolvers,
	langSettingResolvers,
);

module.exports = {
	typeDefs,
	resolvers,
};

