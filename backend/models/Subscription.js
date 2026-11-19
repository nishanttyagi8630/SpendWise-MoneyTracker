// Subscription Model
const mongoose = require('mongoose');
const { createModelAdapter } = require('./dbAdapter');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide subscription name (e.g. Netflix, Gym)'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please provide recurring cost'],
    min: [0.01, 'Amount must be greater than zero'],
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly', 'weekly'],
    default: 'monthly',
  },
  category: {
    type: String,
    default: 'Entertainment',
    trim: true,
  },
  paymentMethod: {
    type: String,
    default: 'Credit Card',
    trim: true,
  },
  nextDueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled'],
    default: 'active',
  },
  notes: {
    type: String,
    default: '',
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MongooseSubscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
const Subscription = createModelAdapter('subscriptions', MongooseSubscription);

module.exports = Subscription;
