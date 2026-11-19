// Budget Model
const mongoose = require('mongoose');
const { createModelAdapter } = require('./dbAdapter');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: [true, 'Please provide a category for the budget'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please provide a budget limit amount'],
    min: [1, 'Budget limit must be at least 1'],
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MongooseBudget = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);
const Budget = createModelAdapter('budgets', MongooseBudget);

module.exports = Budget;
