"use strict";


const util = require('util'),
      mongoose = require('mongoose'),
      lunarCalendar = require("./LunarCalendar"),
      commonUtil = require('./commonUtil'),
      dbModel = require('./model');


var logger = commonUtil.logger;
var UserDirectory = mongoose.model("UserDirectory");


module.exports.ContactsFinder = ContactsFinder;

function ContactsFinder()
{
  Object.call(this);
}
util.inherits(ContactsFinder, Object);

/**
 * find contacts by birthday
 * 
 * @param {Date}birthday
 * @param result: array
 */
ContactsFinder.prototype.findContactsByBirthday = function(birthday) {

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
  var queryStr = util.format("return ((this.birthdayType == '阳历' && this.birthday.getUTCMonth() == %s && this.birthday.getUTCDate() == %s) || \
                                      (this.birthdayType == '阴历' && this.birthday.getUTCMonth() == %s && this.birthday.getUTCDate() == %s))",
                             birthday.getUTCMonth(), birthday.getUTCDate(),
                             lunarBirthday.getUTCMonth(), lunarBirthday.getUTCDate());
  logger.debug("findBirthday: birthday is %s, lunar birthday is %s",
               commonUtil.toUTCDateString(birthday), commonUtil.toUTCDateString(lunarBirthday));
  return UserDirectory.find({$where: queryStr});
  
};
