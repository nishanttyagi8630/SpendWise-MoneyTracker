// Transaction Model
const mongoose = require('mongoose');
const { createModelAdapter } = require('./dbAdapter');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Transaction type must be income or expense'],
  },
  amount: {
    type: Number,
    required: [true, 'Please provide an amount'],
    min: [0.01, 'Amount must be greater than zero'],
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MongooseTransaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
const Transaction = createModelAdapter('transactions', MongooseTransaction);

module.exports = Transaction;
