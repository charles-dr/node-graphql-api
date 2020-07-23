const path = require('path');
const StreamService = require(path.resolve('src/lib/StreamService'));

module.exports = async (_, __, { dataSources: { repository }, user}) => {
  return repository.liveStream.getAll()
    .then(streams => {
      return Promise.all(streams.map(stream => StreamService.generateSlug(stream)));
    })
    .then(() => true)
    .catch(error => {
      console.log('[updateLiveStreamSlug][Error]', error);
      return false;
    })
}