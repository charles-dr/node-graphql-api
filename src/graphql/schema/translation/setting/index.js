const { gql } = require('apollo-server');

const schema = gql`
	type LangSetting {
		version: String!
	}

	# type langSettingInput {
	# 	version: String!
	# }

	extend type Query {
		langSetting: LangSetting!
	}

  extend type Mutation {
    #   """
    #       Allows: authorized user
    #   """
		updateLangSetting(version: String!): LangSetting!
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
	Query: {
		langSetting: async (_, __, { dataSources: { repository } }) => repository.langSetting.load(),
	},
	Mutation: {
		updateLangSetting: async (_, data, { dataSources: { repository } }) => repository.langSetting.update(data)
	},
};
