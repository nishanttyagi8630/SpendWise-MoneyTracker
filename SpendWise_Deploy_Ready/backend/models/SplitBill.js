// Split Bill Model (Shared expenses with friends / roommates)
const mongoose = require('mongoose');
const { createModelAdapter } = require('./dbAdapter');

const splitBillSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please provide a title for the shared expense'],
    trim: true,
  },
  totalAmount: {
    type: Number,
    required: [true, 'Please provide the total bill amount'],
    min: [0.01, 'Amount must be greater than zero'],
  },
  category: {
    type: String,
    default: 'Food & Dining',
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  paidBy: {
    type: String,
    default: 'You',
    trim: true,
  },
  participants: [
    {
      name: { type: String, required: true },
      share: { type: Number, required: true },
      isPaid: { type: Boolean, default: false },
    }
  ],
  notes: {
    type: String,
    default: '',
    trim: true,
  },
  isSettled: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MongooseSplitBill = mongoose.models.SplitBill || mongoose.model('SplitBill', splitBillSchema);
const SplitBill = createModelAdapter('splitBills', MongooseSplitBill);

module.exports = SplitBill;
