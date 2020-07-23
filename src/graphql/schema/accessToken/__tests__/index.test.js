const path = require('path');
const { gql } = require('apollo-server');
const faker = require('faker');

const clientFactory = require(path.resolve('config/graphqlTestClient'));
const { data: { users: userFixtures } } = require(path.resolve('src/graphql/schema/user/fixtures'));

const mutation = gql`
    mutation generateAccessToken($email: String!, $password: String!) {
        generateAccessToken(data: {email: $email, password: $password})
    }
`;

describe('Test accesstoken creation', () => {
  const client = clientFactory({ silent: true });
  it('should failed with empty data', async () => {
    await expect(
      client.mutate({
        mutation,
        variables: { email: '', password: '' },
      }),
    ).rejects.toThrowError('GraphQL error: The email field is mandatory.');
  });

  it('should failed without password', async () => {
    await expect(
      client.mutate({
        mutation,
        variables: { email: faker.internet.email(), password: '' },
      }),
    ).rejects.toThrowError('GraphQL error: The password field is mandatory.');
  });

  it('should failed when user with email exist', async () => {
    await expect(
      client.mutate({
        mutation,
        variables: { email: faker.internet.email(), password: faker.internet.password() },
      }),
    ).rejects.toThrowError('GraphQL error: Invalid login or password');
  });
});

describe('Acess Token genration', () => {
  const client = clientFactory();

  it('should get token for random the fixture user', async () => {
    const randomUserIndex = faker.random.number(userFixtures.length - 1);
    await expect(
      client.mutate({
        mutation,
        variables: userFixtures[randomUserIndex],
      }),
    )
      .resolves
      .toMatchObject({
        data: { generateAccessToken: expect.stringMatching(/[^.]*\.[^.]*\.[^.]*/) },
      });
  });
});
