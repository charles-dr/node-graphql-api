const fetch = require('node-fetch');
const { ApolloClient } = require('apollo-client');
const { InMemoryCache } = require('apollo-cache-inmemory');
const { onError } = require('apollo-link-error');
const { ApolloLink } = require('apollo-link');
const { createHttpLink } = require('apollo-link-http');
const { print } = require('graphql/language/printer');
const { tests } = require('./index');
const logger = require('./logger');

const httpLinkOptions = {
  uri: tests.entrypoint,
  headers: {},
  fetch,
};

const linkError = onError(({
  graphQLErrors, networkError, response, operation,
}) => {
  if (operation) {
    logger.error(`[GraphQL Operation] query: ${print(operation.query)}, variables: ${JSON.stringify(operation.variables)}`);
  }

  if (response) {
    response.errors.forEach((error) => logger.error(`[GraphQL errors] ${JSON.stringify(error)}`));
  }

  if (graphQLErrors) {
    graphQLErrors.map(({ message, locations, path }) => logger.error(
      `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`,
    ));
  }

  if (networkError) {
    if (networkError.statusCode) {
      logger.error(`[Network error][status: ${networkError.statusCode}]: ${networkError}`);
    } else {
      logger.error(`[Network error]: ${networkError}`);
    }
  }
});

const defaultOptions = {
  watchQuery: {
    fetchPolicy: 'network-only',
    errorPolicy: 'ignore',
  },
  query: {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  },
};

module.exports = (options = {}) => {
  const { silent = false } = options;
  const links = [];
  if (!silent) {
    links.push(linkError);
  }
  links.push(createHttpLink(httpLinkOptions));

  return new ApolloClient({
    link: ApolloLink.from(links),
    cache: new InMemoryCache(),
    defaultOptions,
  });
};
