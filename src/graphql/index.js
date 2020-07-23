
const { ApolloServer } = require('apollo-server-express');
const responseCachePlugin = require('apollo-server-plugin-response-cache').default;
const path = require('path');

const config = require(path.resolve('config'));
const logger = require(path.resolve('config/logger'));
const createSchema = require('./schema');

const secureContextMiddlewareFactory = require(path.resolve('src/lib/ApolloSecureContextMiddleware'));
const checkMongoTimedout = require(path.resolve('src/lib/MonitorDBTimeout'));

module.exports = ({ repository }) => new ApolloServer({
  schema: createSchema(),
  formatError: (error) => {
    const sendError = error;
    checkMongoTimedout(error);

    if (error.extensions && error.extensions.code === 'INTERNAL_SERVER_ERROR') {
      logger.error(JSON.stringify(error));
      sendError.message = 'Internal server error';
    } else if (config.isDebugMode) {
      logger.debug(JSON.stringify(error));
    }

    if (config.env === 'production') {
      delete sendError.extensions.exception;
    }

    return sendError;
  },
  context: async (request) => {
    const context = await secureContextMiddlewareFactory(repository)(request);
    if (request.connection) {
      context.user = request.connection.context.user;
      context.dataSources = { repository };
    }
    return context;
  },
  subscriptions: {
    keepAlive: 10000,
    onConnect: async (connectionParams, webSocket, context) => {
      const secureContext = await secureContextMiddlewareFactory(repository)({
        connection: { context: connectionParams },
      });

      if (!secureContext.user) {
        logger.error('[WS]: User not found');
        webSocket.close();
        return;
      }

      repository.user.setOnlineState(secureContext.user.id, true);

      return { user: secureContext.user };
    },
    onDisconnect: async (webSocket, context) => {
      const initialContext = await context.initPromise;

      repository.user.setOnlineState(initialContext.user.id, false);
    },
  },
  introspection: true,
  playground: {
    settings: {
      'editor.theme': 'light',
    },
  },

  engine: {
    apiKey: config.env === 'production' ? config.apolloEngineApiKey : null,
    useUnifiedTopology: true,
  },
  generateClientInfo: ({ request }) => {
    // eslint-disable-next-line no-bitwise
    const headers = request.http & request.http.headers;
    if (headers) {
      return {
        clientName: headers['apollo-client-name'],
        clientVersion: headers['apollo-client-version'],
      };
    }
    return {
      clientName: 'Unknown Client',
      clientVersion: 'Unversioned',
    };
  },
  dataSources: () => ({ repository }),
  plugins: [
    responseCachePlugin({}),
  ],
  cacheControl: {
    defaultMaxAge: 10000,
  },
});
