const { gql } = require('apollo-server');
const path = require('path');

const { GenderType } = require(path.resolve('src/lib/Enums'));

const addUser = require('./resolvers/addUser');
const addNewUser = require('./resolvers/addNewUser');
const addUserBySocial = require('./resolvers/addUserBySocial');
const addUserByPhone = require('./resolvers/addUserByPhone');
const updateUser = require('./resolvers/updateUser');
const updateUserEmailPhone = require('./resolvers/updateUserEmailPhone');
const updateUsers = require('./resolvers/updateUsers');
const changePassword = require('./resolvers/changePassword');
const changeDeviceId = require('./resolvers/changeDeviceId');
const uploadBulkUsers = require('./resolvers/uploadBulkUsers');
const requestResetPassword = require('./resolvers/requestResetPassword');
const userList = require('./resolvers/userList');
const deleteUser = require('./resolvers/deleteUser');
const updateSeller = require('./resolvers/updateSeller');
const followUser = require('./resolvers/followUser');
const unfollowUser = require('./resolvers/unfollowUser');

const schema = gql`
    enum GenderType {
      ${GenderType.toGQL()}
    }

    type Color {
      background: String!
      text: String!
    }

    type User {
      id: ID!
      email: String
      name: String
      phone: String
      address: Address
      location: LatLng
      photo: Asset
      organization: Organization
      roles: [String]! @auth(requires: ADMIN)
      fee: Float
      isOnline: Boolean
      gender: GenderType
      color: Color
      followStats: FollowStats
      rating: RateStats!
      isAnonymous: Boolean!
      anonymousId: String
      nick_name: String
      country: String
      hometown: String
    }

    type FollowStats {
      following(skip: Int = 0, limit: Int = 10): [User]
      nFollowing: Int!
      followers(skip: Int = 0, limit: Int = 10): [User]
      nFollowers: Int!
      """Shows whether I'm following current user or not. """
      isFollowing: Boolean
      """Shows whether I'm followed by current user or not. """
      isFollowed: Boolean
    }

    type UserInfo {
      id: ID!
      email: String
      name: String
      phone: String
      address: Address
      location: LatLng
      photo: Asset
      color: Color
      followStats: FollowStats
      organization: Organization
      settings: UserSettings
      purchase: Float
      revenue: Float
      fee: Float
      roles: [String]! 
    }

    type UserCollection {
      collection: [UserInfo]!
      pager: Pager
    }

    type RequestRestPasswordResponse {
      success: Boolean!
      request_id: String
    }

    enum UserSortFeature {
      CREATED_AT
      PRICE
    }

    input UserFilterInput {
      searchQuery: String
      language: [ID!]
      currency: [ID!]
      zipcode: [ID!]
      country: [ID!]
      name: String
      useremail: String
      userID: ID
      phone: String
      seller: Boolean
    }

    input UserSortInput {
      feature: UserSortFeature! = CREATED_AT
      type: SortTypeEnum! = ASC
    }

    input RegistrationInput {
      email: String!
      password: String!
      anonymousId: String
    }

    input ColorInput {
      background: String!
      text: String!
    }

    input UserInput {
      name: String
      email: String
      phone: String
      countryCode: String
      address: AddressInput
      location: LatLngInput
      photo: ID
      gender: GenderType
      color: ColorInput
      nick_name: String
      country: String
      hometown: String
    }

    input NewUserInput {
      name: String
      email: String!
      password: String!
      phone: String!
      countryCode: String!
      address: AddressInput
      location: LatLngInput
      currency: Currency
      language: LanguageList
      photo: ID
    }

    input UpdateUserInput {
      id: ID!
      name: String
      countryCode: String
      address: AddressInput
      location: LatLngInput
      currency: Currency
      language: LanguageList
      photo: ID
      fee: Float
    }

    input SocialLoginInput {
      provider: LoginProvider!
      token: String!
      anonymousId: String
    }

    input PhoneLoginInput {
      phone: String!,
      countryCode: String!
      password: String!
      anonymousId: String
    }


    extend type Query {
      getUserById(id: ID!): UserInfo!
      getUserByPhone(phone: String!): User
      getUserByEmail(email: String!): User
      getUserByName(name: String!): User
      """Allows: authorized user"""
      me: User! @auth(requires: USER) 
      userList (
        filter: UserFilterInput = {},
        sort: UserSortInput = {},
        page: PageInput = {}
      ): UserCollection! @auth(requires: ADMIN)
    }

    extend type Mutation {
      addUser (data: RegistrationInput!): User!
      addNewUser (data: NewUserInput!): User! @auth(requires: ADMIN)
      addUserByPhone (data: PhoneLoginInput!): User!
      addUserBySocial (data: SocialLoginInput!): User!
      """Allows: authorized user"""
      updateUser (data: UserInput!): User! @auth(requires: USER)
      updateUserEmailPhone (data: UserInput!): User! @auth(requires: USER)
      updateUsers (data: [UpdateUserInput!]!): [UserInfo!] @auth(requires: ADMIN)
      updateSeller (data: UpdateUserInput!): UserInfo! @auth(requires: ADMIN)
      changePassword(email: String, password: String, phone: String, request_id: String,  verificationCode: String!, newPassword: String!): Boolean!
      changeDeviceId(deviceId: String!): Boolean! @auth(requires: USER)
      uploadBulkUsers(path: String!): [User!]! @auth(requires: ADMIN)
      requestResetPassword(email: String, phone: String, countryCode: String): RequestRestPasswordResponse!
      deleteUser(id: ID!): DeleteResult! @auth(requires: ADMIN)

      """
        - Alllows: authorized user
        - returns profile data.
      """
      followUser(id: ID!): User @auth(requires: USER)
      """
        - Alllows: authorized user
        - returns profile data.
      """
      unfollowUser(id: ID!): User @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    me: async (obj, args, { user, dataSources: { repository } }) => {
      if (!user.streamToken) {
        const userUpdate = await repository.user.update(user.id, {});
        return userUpdate;
      }
      return user;
    },
    getUserById: async (_, { id }, { dataSources: { repository } }) => (
      repository.user.getById(id)
    ),
    getUserByPhone: async (_, { phone }, { dataSources: { repository } }) => repository.user.findByPhone(phone),
    getUserByEmail: async (_, { email }, { dataSources: { repository } }) => repository.user.findByEmail(email),
    getUserByName: async (_, { name }, { dataSources: { repository } }) => repository.user.findByName(name),
    userList,
  },
  Mutation: {
    addUser,
    addUserBySocial,
    addUserByPhone,
    updateUser,
    updateUserEmailPhone,
    changePassword,
    uploadBulkUsers,
    changeDeviceId,
    requestResetPassword,
    updateUsers,
    deleteUser,
    updateSeller,
    followUser,
    unfollowUser,
  },
  User: {
    photo(user, args, { dataSources: { repository } }) {
      return repository.asset.load(user.photo);
    },
    organization(user, args, { dataSources: { repository } }) {
      return repository.organization.getByUser(user.id);
    },
    isOnline(user, _, { dataSources: { repository } }) {
      return !!user.isOnline;
    },
    followStats(user) { return user; },
    rating: async (user, _, { dataSources: { repository } }) => ({
      average: repository.rating.getAverage(user.getTagName()),
      total: repository.rating.getTotal({ tag: user.getTagName() }),
    }),
    fee(user) {
      return user.fee * 100;
    },
  },
  UserSettings: {
    moneyDetails: async ({ settings }) => {
      const amount = CurrencyFactory.getAmountOfMoney({ centsAmount: 0, currency: settings.currency });
      return {
        ISO: settings.currency,
        symbol: amount.getSymbol,
      };
    },
    language: async ({ settings }, _, { dataSources: { repository } }) => (
      repository.language.getById(settings.language)
    ),
  },
  UserInfo: {
    photo: async (user, args, { dataSources: { repository } }) => repository.asset.load(user.photo),
    purchase: async ({ user }) => 0,
    revenue: async ({ user }) => 0,
    organization(user, args, { dataSources: { repository } }) {
      return repository.organization.getByUser(user.id);
    },
    followStats(user) { return user; },
  },
  FollowStats: {
    following(user, { skip, limit }, { dataSources: { repository } }) {
      const userIds = user.following.filter((tag) => tag.includes('User:')).map((tag) => tag.replace('User:', '')).slice(skip, limit);
      return repository.user.paginate({ query: { _id: { $in: userIds } }, page: { skip: 0, limit } });
    },
    nFollowing(user, _, { dataSources: { repository } }) {
      return (user.following || []).length;
    },
    followers(user, { skip, limit }, { dataSources: { repository } }) {
      return repository.user.paginate({ query: { following: user.getTagName() }, page: { skip, limit } });
    },
    nFollowers(user, _, { dataSources: { repository } }) {
      return repository.user.countAll({ following: user.getTagName() });
    },
    isFollowing(target, _, { dataSources: { repository }, user: me }) {
      return me && target.id !== me.id && me.following.includes(target.getTagName());
    },
    isFollowed(target, _, { dataSources: { repository }, user: me }) {
      return me && target.id !== me.id && target.following.includes(me.getTagName());
    },
  },
};
