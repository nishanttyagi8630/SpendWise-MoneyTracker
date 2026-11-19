// User Model
const mongoose = require('mongoose');
const { createModelAdapter } = require('./dbAdapter');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MongooseUser = mongoose.models.User || mongoose.model('User', userSchema);
const User = createModelAdapter('users', MongooseUser);

module.exports = User;
