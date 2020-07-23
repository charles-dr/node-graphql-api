# Fixtures

This is the initial test data, what we can use for tests and develop.

**Fixtures MUST located in schema folder inside entrypoint entity folder**

## What we use for run fixtures
- `bin/fixtures.js` - handler for collect fixtures and executes them
- `fixtures.js` - fixture colletion with right order

> Run fixtures by command `npm run fixtures`

## For example user fixtures

- simple fixture for add new users `src/graphql/schema/user/fixtures/index.js`
- fixtures when we need use another fixture data for do actions `src\graphql\schema\accessToken\fixtures\index.js`
- fixtures where we need use `context` and `authorization` `src\graphql\schema\asset\fixtures\index.js`

## What is the fixture?

Fixture file is a simple Module what MUST export `handler` and optional `data`.

**Handler** is a simple function with parameters 
- client - is a graphql client working with local env. For change entrypoint urk use `TEST_ENTIPOINT` environment viriable.
- context - is a bag for data what generate other fixtures. You can use or add anything to this bag inside your fixture.
- data - is a initial fixtures data from all fixtures.

**Data** is a fixture data. It optional because some of fixtures may not use anything own but use data from another fixtures. For example like it does AccessToken fixture.

## How to add new fixture
1. create `fixtures` folder in inside necessary schema API entity
2. create file `index.js`, write code there. Export 2 things `handler` and `data` (optional)
3. open file `fixtures.json` at the root of the project. and add there your fixture file in right order.
4. done
