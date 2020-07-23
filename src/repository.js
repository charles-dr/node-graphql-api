const path = require('path');

const repositoryFactory = require(path.resolve('src/lib/RepositoryFactory'));

// Dir paths are relative for "lib" dir
module.exports = repositoryFactory(path.resolve('src/model'), path.resolve('src/repository'));
