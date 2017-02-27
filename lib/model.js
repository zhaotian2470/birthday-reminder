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
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'Users',
    required: 'Please fill users'
  }
});

exports.UserDirectory = mongoose.model('UserDirectory', UserDirectorySchema);

var UsersSchema = new Schema({
  username: {
    type: String,
    required: 'Please fill user name',
    trim: true
  },
  password: {
    type: String,
    required: 'Please fill user password (md5)',
    trim: true
  },
  email: {
    type: String,
    validate: /^.*@.*$/,
    required: 'Please fill user email',
    trim: true
  }
});

exports.Users = mongoose.model('Users', UsersSchema);
