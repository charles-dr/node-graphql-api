# Tests

## What we use for testings
- `jestJS` - running all tests
- `Apollo Client` - real graphql client
- `bluebird` - manage fixtures running
- `bin/fixtures.js` - handler for collect fixtures and executes them
- `fixtures.js` - fixture colletion with right order

> Run all tests by command `npm run test`

## Kind of tests we have and use
1. **Unit Tests**. Use for test classes and functions.
2. **Integration Tests**. Use for testing API entrypoints

## What we can test and how?
1. Repositories. use Unit Tests
2. Libraries. use Unit Tests
3. Resolvers. use Unit Tests
4. API Entrypoints. For this we use Integrational Tests

## Unit Tests examples
1. Repository testing `src\repository\__tests__\UserRepository.test.js`. These we add `ModelMock` easyly create repository with it Model.
2. ...

## Integration tests examples
1. API entrypoint testing `src\graphql\schema\accessToken\__tests__\index.test.js`. This test use fixture data for do testings.
2. ...


## For run tests
1. clean mongo database
2. run docker containers
3. execute `npm run fixtures`
4. execute `nmp run test`