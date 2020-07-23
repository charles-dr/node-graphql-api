const requireDir = require('require-dir');

const providers = requireDir('./providers');

module.exports.OAuth2Service = {
  getStrategy(provider) {
    const providerStrategy = providers[provider];
    if (!providerStrategy) {
      throw new Error(`OAuth2 provider "${provider}" has no implementation.`);
    }

    return providerStrategy;
  },
};
