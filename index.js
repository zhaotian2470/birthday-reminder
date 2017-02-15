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

  handleContactsBirthday();
  setInterval(handleContactsBirthday, 24 * 3600 * 1000);

});

/**
 * handle birthday in contacts
 */
function handleContactsBirthday() {

  // get important birthdays
  var birthdays = [];
  var today = new Date();
  config.get("remaindBeforeDays").forEach(function(day) {
    var birthday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + day));
    birthdays.push(birthday);
  });

  // remiand birthdays
  remaindBirthdays(birthdays);
}

/**
 * send birthday remainder on specific days
 * 
 * @param {Array of Date}birthdays
 */
function remaindBirthdays(birthdays) {

  // show log
  var birthdaysStr = "[";
  birthdays.forEach(function(birthday) {
    birthdaysStr += commonUtil.toUTCDateString(birthday) + ", ";
  });
  birthdaysStr += "]";
  logger.info("remaind birthdays on %s", birthdaysStr);

  // fill emailOptions
  var emailOptions = {
    from: config.get("emailOptions.from"),
    to: config.get("emailOptions.to"),
    subject: util.format("birthday remainder sent on %s", commonUtil.toUTCDateString(new Date())),
    text: '',
    html: ''
  };

  var finder = new contactsFinder.ContactsFinder();
  var birthdayPromises = [];
  birthdays.forEach(function(birthday) {
    birthdayPromises.push(finder.findContactsByBirthday(birthday)
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
