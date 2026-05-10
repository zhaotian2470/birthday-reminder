"use strict";

const nodemailer = require('nodemailer');
const commonUtil = require('./commonUtil');

const logger = commonUtil.logger;


class EmailSender {

  constructor(emailTransportOptions) {
    logger.info("email transport options: %j", emailTransportOptions);
    this.emailTransport = nodemailer.createTransport(emailTransportOptions);
    this.maxRetries = commonUtil.config.get("emailOptions.maxRetries");
  }

  async sendEmail(emailOptions, retries) {
    retries = retries || 0;

    if (!Number.isInteger(retries) || retries < 0 || retries > this.maxRetries) {
      logger.error("error to send email with retries: %s", retries);
      return;
    }

    try {
      logger.debug("send email with options %j, retries: %s", emailOptions, retries);
      const info = await this.emailTransport.sendMail(emailOptions);
      logger.info("success to send email: %s", info.response);
    } catch (error) {
      logger.warn("failed to send email: %j", error);
      await this.sendEmail(emailOptions, retries + 1);
    }
  }
}

module.exports.EmailSender = EmailSender;
