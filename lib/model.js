'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var UserDirectorySchema = new Schema({
  name: {
    type: String,
    required: 'Please fill user directory name',
    trim: true
  },
  birthday: {
    type: Date,
    required: 'Please fill user directory birthday',
  },
  birthdayType: {
    type: String,
    validate: /^阴历$|^阳历$/,
    required: 'Please fill user directory birthdayType',
    trim: true
  }
});

exports.UserDirectory = mongoose.model('UserDirectory', UserDirectorySchema);
