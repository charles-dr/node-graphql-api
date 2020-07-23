/* eslint-disable no-shadow */
const { createLogger, format, transports } = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');
const { logs } = require('./index');
const { env } = require('./index');

const {
  combine, timestamp, label, printf,
} = format;

const myFormat = printf(({
  level, message, label, timestamp,
}) => `${timestamp} ${label} ${level}: ${message}`);


let transport = null;
if (logs.cloudWatchEnabled) {
  transport = new WinstonCloudWatch({
    level: logs.level,
    name: logs.name,
    logGroupName: env,
    logStreamName: 'api',
    awsRegion: logs.awsRegion,
  });
} else {
  transport = new transports.Console();
}

const logger = createLogger({
  level: logs.level,
  format: combine(
    label({ label: `[${logs.name}]` }),
    timestamp(),
    myFormat,
  ),
  transports: [
    transport,
  ],
  exitOnError: false,
});

logger.stream = {
  write(message, encoding) {
    logger.info(message);
  },
};

module.exports = logger;
