const { mongo } = require('./config');

module.exports = {
  dbConnectionUri: mongo.migrateUri,
  migrationsDir: 'src/migrations',
};
