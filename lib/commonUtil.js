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
                     ("0000" + date.getUTCFullYear()).slice(-4),
                     ("00" + (date.getUTCMonth() + 1)).slice(-2),
                     ("00" + date.getUTCDate()).slice(-2));
};
