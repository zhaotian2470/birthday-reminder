"use strict";

const util = require('util');
const mongoose = require('mongoose');
const lunarCalendar = require("./LunarCalendar");
const commonUtil = require('./commonUtil');
const dbModel = require('./model');

const logger = commonUtil.logger;
const Users = mongoose.model("Users");
const UserDirectory = mongoose.model("UserDirectory");
const OperationQueue = mongoose.model("OperationQueue");


class ContactsFinder {

  async getBirthdayRemainderOperations() {
    const operations = await OperationQueue.find({ "name": "birthdayRemainder" });
    for (const op of operations) {
      await op.deleteOne();
    }
    return operations;
  }

  findUsers(param) {
    return Users.find(param);
  }

  findUserContactsByBirthday(id, birthday) {
    const lunarDate = lunarCalendar.solarToLunar(birthday.getUTCFullYear(),
                                                 birthday.getUTCMonth() + 1,
                                                 birthday.getUTCDate());
    let lunarMonth = lunarDate.lunarMonth;
    if (lunarDate.lunarLeapMonth !== 0 && lunarDate.lunarLeapMonth < lunarMonth) {
      lunarMonth--;
    }

    const lunarBirthday = new Date(Date.UTC(
      lunarDate.lunarYear,
      lunarMonth - 1,
      lunarDate.lunarDay
    ));

    const queryFormat = "return (this.ownerId == '%s' && " +
        "((this.birthdayType == '阳历' && this.birthday.getUTCMonth() == %s && this.birthday.getUTCDate() == %s) || " +
        "(this.birthdayType == '阴历' && this.birthday.getUTCMonth() == %s && this.birthday.getUTCDate() == %s)))";
    const queryStr = util.format(queryFormat,
                                 id.toString(),
                                 birthday.getUTCMonth(), birthday.getUTCDate(),
                                 lunarBirthday.getUTCMonth(), lunarBirthday.getUTCDate());
    logger.debug("findBirthday: id is %s, birthday is %s, lunar birthday is %s",
                 id.toString(), commonUtil.toUTCDateString(birthday), commonUtil.toUTCDateString(lunarBirthday));
    return UserDirectory.find({ $where: queryStr });
  }
}

module.exports.ContactsFinder = ContactsFinder;
