/**
 *
 * birthday remainder
 * 
 */

"use strict";


const util = require('util'),
      bluebird = require('bluebird'),
      mongoose = require('mongoose'),
      commonUtil = require('./lib/commonUtil'),
      contactsFinder = require('./lib/contactsFinder.js'),
      emailSender = require('./lib/emailSender.js');

var logger = commonUtil.logger;
var config = commonUtil.config;


// main procedure: connect mongo and handle birthdays
const mangoUrl = util.format("mongodb://%s/%s", config.get("dbConfig.host"), config.get("dbConfig.dbName"));
mongoose.Promise = bluebird;
mongoose.connect(mangoUrl, function(mongoError) {

  // handle connection error
  if(mongoError) {
    logger.error("failed to connect to mongo %s: %j", mangoUrl, mongoError);
    return;
  }

  remaindBirthdays();
  setInterval(remaindBirthdays, 24 * 3600 * 1000);

});

/**
 * remaind all user's birthdays
 */
function remaindBirthdays() {

  // get important birthdays
  var birthdays = [];
  var today = new Date();
  config.get("remaindBeforeDays").forEach(function(day) {
    var birthday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + day));
    birthdays.push(birthday);
  });

  // remiand user birthdays
  var finder = new contactsFinder.ContactsFinder();
  finder.findUsers()
    .then(function(value) {
      value.forEach(function(element) {
        remaindUserBirthdays(element, birthdays);
      });
    });
}

/**
 * send birthday remainder on specific user
 * 
 * @param {user from db}user
 * @param {Array of Date}birthdays
 */
function remaindUserBirthdays(user, birthdays) {

  // show log
  var birthdaysStr = "[";
  birthdays.forEach(function(birthday) {
    birthdaysStr += commonUtil.toUTCDateString(birthday) + ", ";
  });
  birthdaysStr += "]";
  logger.info("remaind user birthdays: user id is %s, user email is %s, birthdays is %s",
              user._id, user.email, birthdaysStr);

  // fill emailOptions
  var emailOptions = {
    from: config.get("emailOptions.from"),
    to: user.email,
    subject: util.format("birthday remainder sent on %s", commonUtil.toUTCDateString(new Date())),
    text: '',
    html: ''
  };

  var finder = new contactsFinder.ContactsFinder();
  var birthdayPromises = [];
  birthdays.forEach(function(birthday) {
    birthdayPromises.push(finder.findUserContactsByBirthday(user._id, birthday)
                          .then(function(value) {
                            if (value.length !== 0) {
                              emailOptions.text += util.format("birthday on %s:\n", commonUtil.toUTCDateString(birthday));
	                      value.forEach(function(element) {
	                        emailOptions.text += util.format("  name: %s, birthday: %s, birthday type: %s\n",
					                         element.name,
                                                                 commonUtil.toUTCDateString(element.birthday),
                                                                 element.birthdayType);
	                      });
	                      emailOptions.text += "\n";
                            }
                          })
                         );

  });

  // send email
  bluebird.all(birthdayPromises)
    .then(function() {
      logger.info("remaind birthdays emailOptions: %j", emailOptions);
      if(emailOptions.text !== '') {
        emailOptions.html = "<pre>" + emailOptions.text + "</pre>";
        new emailSender.EmailSender(config.get("emailOptions.transport")).sendEmail(emailOptions);
      }
    });

}
