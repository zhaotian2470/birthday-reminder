"use strict";


const util = require('util'),
      config = require('config'),
      bunyan = require('bunyan');


module.exports.config = config;

module.exports.logger = bunyan.createLogger({name: config.get("mainLogName"),
					     'level': config.get("mainLogLevel"),
					     'src': config.get("mainLogSrc")});

module.exports.toUTCDateString = function(date) {
  return util.format("%s-%s-%s",
                     date.getUTCFullYear(),
                     date.getUTCMonth() + 1,
                     date.getUTCDate());
};
