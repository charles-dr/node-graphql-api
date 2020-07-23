
const faker = require('faker');
const UserRepository = require('../UserRepository');

const ModelMock = {
  constructor(data) {
    this.data = data;
    return this;
  },

  clear() {
    this.data = null;
    this.findOne = async () => false;
    this.save = async () => true;
  },
};

describe('Tests creation with the wrong datas', () => {
  const repo = new UserRepository(ModelMock);

  beforeAll(() => {
    ModelMock.clear();
  });

  it('should fail with empty email', async () => {
    expect.assertions(1);
    await expect(repo.create({}))
      .rejects
      .toThrowError('Email is required!');
  });

  it('should fail with empty password', async () => {
    expect.assertions(1);
    await expect(repo.create({ email: faker.internet.email() }))
      .rejects
      .toThrowError('Password is required!');
  });

  it('should fail with existing email', async () => {
    expect.assertions(1);
    const email = faker.internet.email();
    ModelMock.findOne = async () => true;

    await expect(repo.create({ email, password: faker.internet.password(6) }))
      .rejects
      .toThrowError(`Email "${email}" is already taken!`);
  });
});
