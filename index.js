/**
 *
 * birthday remainder
 *
 */

"use strict";

// Node.js 18 does not expose crypto as a global; polyfill for mongodb driver
if (!global.crypto) {
  global.crypto = require('crypto').webcrypto;
}

const util = require('util');
const mongoose = require('mongoose');
const commonUtil = require('./lib/commonUtil');
const contactsFinder = require('./lib/contactsFinder.js');
const emailSender = require('./lib/emailSender.js');

const logger = commonUtil.logger;
const config = commonUtil.config;

const mongoUrl = util.format("mongodb://%s/%s", config.get("dbConfig.host"), config.get("dbConfig.dbName"));

mongoose.connect(mongoUrl)
  .then(() => {
    checkBirthdaysDaily();
    setInterval(checkBirthdaysDaily, 24 * 3600 * 1000);
    setInterval(checkPendingBirthdays, 60 * 1000);
  })
  .catch((mongoError) => {
    logger.error("failed to connect to mongo %s: %j", mongoUrl, mongoError);
  });

async function checkBirthdaysDaily() {
  const finder = new contactsFinder.ContactsFinder();
  const users = await finder.findUsers({});
  for (const user of users) {
    await remaindUserBirthdays(user);
  }
}

async function checkPendingBirthdays() {
  const finder = new contactsFinder.ContactsFinder();
  const operations = await finder.getBirthdayRemainderOperations();
  for (const operation of operations) {
    const users = await finder.findUsers({ "_id": operation.parameters[0] });
    for (const user of users) {
      await remaindUserBirthdays(user);
    }
  }
}

async function remaindUserBirthdays(user) {
  const birthdays = [];
  const today = new Date();
  config.get("remaindBeforeDays").forEach((day) => {
    birthdays.push(new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + day)));
  });

  const birthdaysStr = "[" + birthdays.map((b) => commonUtil.toUTCDateString(b)).join(", ") + "]";
  logger.info("remaind user birthdays: user id is %s, user email is %s, birthdays is %s",
              user._id, user.email, birthdaysStr);

  const emailOptions = {
    from: config.get("emailOptions.from"),
    to: user.email,
    subject: util.format("birthday remainder sent on %s", commonUtil.toUTCDateString(new Date())),
    text: '',
    html: ''
  };

  const finder = new contactsFinder.ContactsFinder();
  await Promise.all(birthdays.map(async (birthday) => {
    const contacts = await finder.findUserContactsByBirthday(user._id, birthday);
    if (contacts.length !== 0) {
      emailOptions.text += util.format("birthday on %s:\n", commonUtil.toUTCDateString(birthday));
      contacts.forEach((element) => {
        emailOptions.text += util.format("  name: %s, birthday: %s, birthday type: %s\n",
                                         element.name,
                                         commonUtil.toUTCDateString(element.birthday),
                                         element.birthdayType);
      });
      emailOptions.text += "\n";
    }
  }));

  logger.info("remaind birthdays emailOptions: %j", emailOptions);
  if (emailOptions.text !== '') {
    emailOptions.html = "<pre>" + emailOptions.text + "</pre>";
    await new emailSender.EmailSender(config.get("emailOptions.transport")).sendEmail(emailOptions);
  }
}
