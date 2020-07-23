const { httpServer } = require('./src/app');
const config = require('./config');
const logger = require('./config/logger');

/**
 * Event listener for HTTP server "error" event.
 */
function generateOnErrorFn(usedPost) {
  return (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof usedPost === 'string'
      ? `Pipe ${usedPost}`
      : `Port ${usedPost}`;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        logger.error(`${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        logger.error(`${bind} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  };
}

/**
 * Listen on provided port, on all network interfaces.
 */
httpServer.listen(config.port);
httpServer.on('error', generateOnErrorFn(config.port));
httpServer.on('listening', () => {
  logger.info('🚀 API server started');
  if (config.isDebugMode) {
    logger.info('[DEBUG MODE] Enabled. Next message should be debug message!');
    logger.debug('[DEBUG MODE] If you see it, debug mode works!');
  }
});
