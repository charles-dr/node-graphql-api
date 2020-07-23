const requireDir = require('require-dir');

const requireOptions = {
  recurse: false,
  extensions: ['.js'],
  noCache: true,
};

module.exports = (modelDir, repositoryDir) => {
  const models = requireDir(modelDir, {
    ...requireOptions,
    mapKey: (value, baseName) => baseName.replace('Model', ''),
  });
  const repositoryClasses = requireDir(repositoryDir, {
    ...requireOptions,
    mapKey: (value, baseName) => baseName.replace('Repository', ''),
  });

  return Object.keys(repositoryClasses).reduce((repository, name) => {
    if (typeof models[name] === 'undefined') {
      throw Error(`There's not Model file for [${name}Repository] repository!`);
    }

    const repositoryName = name.charAt(0).toLowerCase() + name.slice(1);

    // eslint-disable-next-line no-param-reassign
    repository[repositoryName] = new repositoryClasses[name](models[name]);
    return repository;
  }, {});
};
