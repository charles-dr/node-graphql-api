const path = require('path');

const logger = require(path.resolve('config/logger'));

module.exports = class BaseRobot {
  constructor(timeout = 1000 * 60) {
    this.timeout = timeout;
    this.interval = null;

    this.label = `[ROBOTS][${this.constructor.name}]`;
  }

  execute() {
    logger.info(`${this.label} Logic was executed`);
  }

  start() {
    logger.info(`${this.label} Starting`);
    this.execute();
    this.interval = setInterval(this.execute, this.timeout);
  }

  stop() {
    if (this.interval) {
      logger.info(`${this.label} Stopping`);
      clearInterval(this.interval);
    }
  }
};
