const NodeCache = require('node-cache');
const axios = require('axios');
const { exec } = require('child_process');

const cache = new NodeCache();
const cacheId = 'MONGODB_TIMEDOUT_MONITOR';
const discordWebhook = 'https://discord.com/api/webhooks/837027124518977576/_1tA_T_KJ-jyg8p7aLQydPS-YBofPInaV4L11YPRHXSNRAO7DvhNg4kmzZUFyvihVHcq';
const regExp = new RegExp('Server selection timed out after (.*) ms', 'gi');

const activity = {
  checkUnderRestarting: () => {
    const restarting = cache.get(cacheId);
    return restarting;
  },
  markAsRestarting: () => {
    cache.set(cacheId, true);
  },
  notify2Discord: ({ message, title, description }) => {
    return axios.post(discordWebhook, {
      "username": "Shoclef Web",
      "content": message,
      "embeds": [
        {
          "color": 51678,
          "fields": [
            {
              "name": title,
              "value": description,
              "inline": true
            },
          ],
        },
      ],
    });
  },
  restartServer: () => {
    return exec('pm2 restart server');
  },
};


module.exports = async (error) => {
  if (error.extensions.code === 'INTERNAL_SERVER_ERROR') {
    const errors = error.extensions.exception.errors;
    // This is not the our concerned case.
    if (!errors || typeof errors !== 'object') return true;
    
    const targetErrors = errors.filter((err) => {
      const matched = err.message.match(regExp);
      return !!matched;
    });
    
    if (targetErrors.length > 0) {
      if (activity.checkUnderRestarting()) return true;
      activity.markAsRestarting();
      // restart pm2 
      await activity.notify2Discord({
        message: 'Critical error occured!',
        title: error.extensions.code,
        description: targetErrors[0].message,
      });
      activity.restartServer();
    }
  }
  return true;
}
