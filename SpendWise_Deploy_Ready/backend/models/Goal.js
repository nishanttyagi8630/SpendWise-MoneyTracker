// Savings Goal Model
const mongoose = require('mongoose');
const { createModelAdapter } = require('./dbAdapter');

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide a goal name'],
    trim: true,
  },
  targetAmount: {
    type: Number,
    required: [true, 'Please provide a target amount'],
    min: [1, 'Target amount must be at least 1'],
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Current amount cannot be negative'],
  },
  deadline: {
    type: Date,
  },
  category: {
    type: String,
    default: 'Savings',
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MongooseGoal = mongoose.models.Goal || mongoose.model('Goal', goalSchema);
const Goal = createModelAdapter('goals', MongooseGoal);

module.exports = Goal;
