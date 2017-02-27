"use strict";


const util = require('util'),
      mongoose = require('mongoose'),
      lunarCalendar = require("./LunarCalendar"),
      commonUtil = require('./commonUtil'),
      dbModel = require('./model');


var logger = commonUtil.logger;
var Users = mongoose.model("Users");
var UserDirectory = mongoose.model("UserDirectory");


module.exports.ContactsFinder = ContactsFinder;

function ContactsFinder()
{
  Object.call(this);
}
util.inherits(ContactsFinder, Object);

/**
 * find all users
 *
 * @param result: array
 */
ContactsFinder.prototype.findUsers = function() {
  return Users.find();
};

/**
 * find user contacts by birthday
 * 
 * @param {ObjectId}id: user id
 * @param {Date}birthday
 * @param result: array
 */
ContactsFinder.prototype.findUserContactsByBirthday = function(id, birthday) {

  // get lunar birthday
  var lunarDate = lunarCalendar.solarToLunar(birthday.getUTCFullYear(),
                                             birthday.getUTCMonth() + 1,
                                             birthday.getUTCDate());
  var lunarMonth = lunarDate.lunarMonth;
  if(lunarDate.lunarLeapMonth !== 0 && lunarDate.lunarLeapMonth < lunarMonth) {
    lunarMonth--;
  }

  var lunarBirthday = new Date(Date.UTC(
    lunarDate.lunarYear,
    lunarMonth - 1,
    lunarDate.lunarDay
  ));

  // get contacts
  var queryFormat = "return (this.ownerId == '%s' && " +
      "((this.birthdayType == '阳历' && this.birthday.getUTCMonth() == %s && this.birthday.getUTCDate() == %s) || " +
      "(this.birthdayType == '阴历' && this.birthday.getUTCMonth() == %s && this.birthday.getUTCDate() == %s)))";
  var queryStr = util.format(queryFormat,
                             id.toString(),
                             birthday.getUTCMonth(), birthday.getUTCDate(),
                             lunarBirthday.getUTCMonth(), lunarBirthday.getUTCDate());
  logger.debug("findBirthday: id is %s, birthday is %s, lunar birthday is %s",
               id.toString(), commonUtil.toUTCDateString(birthday), commonUtil.toUTCDateString(lunarBirthday));
  return UserDirectory.find({$where: queryStr});
  
};
