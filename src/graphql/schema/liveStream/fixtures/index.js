/* eslint-disable no-param-reassign */
const path = require('path');
const { gql } = require('apollo-server');
const faker = require('faker');

const logger = require(path.resolve('config/logger'));

const addMutation = gql`
    mutation addLiveStream($title: String!, $experience: ID!, $categories: [ID!]!, $preview: ID!, $city: String!) {
        addLiveStream(data: {
            title: $title,
            experience: $experience,
            categories: $categories,
            preview: $preview,
            city: $city
        }) {
            id
            city {
                id
                name
            }
            channel {
                id
            }
            publicMessageThread {
                id
                tags
            }
            privateMessageThreads {
                id
                tags
            }
        }
    }
`;

const joinMutation = gql`
    mutation joinLiveStream($id: ID!) {
        joinLiveStream(id: $id) {
            id
            city {
                id
                name
            }
            channel {
                id
                participants {
                    user {
                        id
                        email
                    }
                }
            }
            publicMessageThread {
                id
                tags
                participants {
                    id
                    email
                }
            }
            privateMessageThreads {
                id
                tags
                participants {
                    id
                    email
                }
            }
        }
    }
`;

const liveStreamData = [
  {
    title: faker.lorem.words(5),
    experience: 'ff27a82a-31b7-4bb8-904a-8ff8875d6c7d',
    categories: ['d713ee93-60b7-479f-ae39-b4e554495a29'],
    city: 'Kiev',
  },
  {
    title: faker.lorem.words(5),
    experience: 'a025aa70-38e4-4ff6-b44b-64cfe1f9e189',
    categories: ['48b1990c-90e3-494c-89f3-e0a2edc92522', '906d886f-6183-4071-809c-f56585367404'],
    city: 'Lviv',
  },
  {
    title: faker.lorem.words(5),
    experience: '68252d52-3195-43c4-8c83-39f3bbbdb1c5',
    categories: ['e516cb92-7a9b-4618-93ef-ad8b535c7b60'],
    city: 'Lviv',
  },
  {
    title: faker.lorem.words(5),
    experience: '68252d52-3195-43c4-8c83-39f3bbbdb1c5',
    categories: ['d713ee93-60b7-479f-ae39-b4e554495a29', 'e516cb92-7a9b-4618-93ef-ad8b535c7b60', '906d886f-6183-4071-809c-f56585367404'],
    city: 'Dnipro',
  },
];

module.exports.data = { liveStream: liveStreamData };

module.exports.handler = async (client, context) => {
  logger.info('[fixture] LiveStream execution!');
  context.liveStreams = [];
  const userEmails = Object.keys(context.users);

  return Promise.all(liveStreamData.map((variables, index) => {
    const email = userEmails[index];
    const { accessToken, assets } = context.users[email];
    return client
      .mutate({
        mutation: addMutation,
        variables: {
          ...variables,
          preview: assets[0].id,
        },
        context: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      })
      .then(({ data: { addLiveStream } }) => addLiveStream);
  }))
    .then((liveStreams) => Promise.all(liveStreams.map((variables, index) => {
      const localIndex = index + 1 < userEmails.length ? index + 1 : 0;
      const subscriberEmail = userEmails[localIndex];
      const streamerEmail = userEmails[index];
      const { accessToken } = context.users[subscriberEmail];
      return client
        .mutate({
          mutation: joinMutation,
          variables,
          context: {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        })
        .then(({ data: { joinLiveStream } }) => {
          if (typeof context.users[streamerEmail].liveStreams === 'undefined') {
            context.users[streamerEmail].liveStreams = [];
          }
          context.users[streamerEmail].liveStreams.push(joinLiveStream);
          context.liveStreams.push(joinLiveStream);
        });
    })));
};
