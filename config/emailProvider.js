const { client: EmailClient } = require('elasticemail-webapiclient');
const { email } = require('./index');
const logger = require('./logger');

const FakeClient = {
  Email: { Send: async () => true },
  isSendingDisabled: true,
};

let client = FakeClient;

if (!email.elasticEmailOptions.apiKey) {
  logger.warn("You didn't provided APP_KEY for Elastic Email. You will not be able to send emails");
} else {
  client = new EmailClient(email.elasticEmailOptions);
  client.isSendingDisabled = false;

  client.Account.Load()
    .then((response) => {
      logger.debug(JSON.stringify(response));
    });
}

module.exports = client;
