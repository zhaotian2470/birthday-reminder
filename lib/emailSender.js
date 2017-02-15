"use strict";


const util = require('util'),
      nodemailer = require('nodemailer'),
      commonUtil = require('./commonUtil');


var logger = commonUtil.logger;


module.exports.EmailSender = EmailSender;

function EmailSender(emailTransportOptions)
{
  logger.info("email transport options: %j", emailTransportOptions);
    
  Object.call(this);
  this.emailTransport = nodemailer.createTransport(emailTransportOptions);
  this.maxRetries = commonUtil.config.get("emailOptions.maxRetries");
}
util.inherits(EmailSender, Object);

EmailSender.prototype.sendEmail = function(emailOptions, retries) {

  var self = this;

  // validate parameter: retries
  retries = retries || 0;
  
  if(!Number.isInteger(retries) || retries < 0 || retries > self.maxRetries) {
    logger.error("error to send email with retries: %s", retries);
    return;
  }

  // send email with retries
  logger.debug("send email with options %j, retries: %s", emailOptions, retries);
  self.emailTransport.sendMail(emailOptions, function(error, info) {
    if(error) {
      logger.warn("failed to send email: %j", error);
      self.sendEmail(emailOptions, ++retries);
    } else {
      logger.info("success to send email: %s", info.response);
    }
  });    
};
