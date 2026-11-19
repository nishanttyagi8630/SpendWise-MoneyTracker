// Subscription Controller
// Tracks recurring bills (Netflix, Spotify, Gym, Rent) & forecasts monthly subscription burn.

const Subscription = require('../models/Subscription');

// @desc    Get all subscriptions for logged-in user with renewal analytics
// @route   GET /api/subscriptions
exports.getSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptions = await Subscription.find({ userId });

    const now = new Date();
    let totalMonthlyBurn = 0;
    let upcomingWithin7Days = [];
    let upcomingWithin30Days = [];
    let activeCount = 0;
    let pausedCount = 0;

    const enriched = subscriptions.map((sub) => {
      const amt = Number(sub.amount) || 0;
      const cycle = sub.billingCycle || 'monthly';
      
      // Calculate monthly equivalent cost
      let monthlyCost = amt;
      if (cycle === 'yearly') monthlyCost = amt / 12;
      else if (cycle === 'weekly') monthlyCost = amt * 4.333;

      if (sub.status === 'active') {
        totalMonthlyBurn += monthlyCost;
        activeCount++;
      } else if (sub.status === 'paused') {
        pausedCount++;
      }

      // Calculate days until renewal
      const dueDate = new Date(sub.nextDueDate);
      const diffMs = dueDate - now;
      const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 7;

      const subData = {
        ...sub,
        monthlyEquivalent: Number(monthlyCost.toFixed(2)),
        daysUntilDue,
        isDueSoon,
        isOverdue: daysUntilDue < 0
      };

      if (sub.status === 'active') {
        if (daysUntilDue >= 0 && daysUntilDue <= 7) {
          upcomingWithin7Days.push(subData);
        }
        if (daysUntilDue >= 0 && daysUntilDue <= 30) {
          upcomingWithin30Days.push(subData);
        }
      }

      return subData;
    });

    // Sort by nextDueDate ascending (soonest due first)
    enriched.sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate));

    return res.status(200).json({
      success: true,
      summary: {
        totalMonthlyBurn: Number(totalMonthlyBurn.toFixed(2)),
        totalYearlyBurn: Number((totalMonthlyBurn * 12).toFixed(2)),
        activeCount,
        pausedCount,
        upcomingWithin7DaysCount: upcomingWithin7Days.length,
        upcomingWithin30DaysCount: upcomingWithin30Days.length,
      },
      upcoming7Days: upcomingWithin7Days,
      data: enriched,
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve subscriptions.'
    });
  }
};

// @desc    Create a new subscription
// @route   POST /api/subscriptions
exports.createSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, amount, billingCycle, category, paymentMethod, nextDueDate, notes } = req.body;

    if (!name || amount === undefined || !nextDueDate) {
      return res.status(400).json({
        success: false,
        message: 'Name, recurring amount, and next due date are required.'
      });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than zero.'
      });
    }

    const newSub = await Subscription.create({
      userId,
      name: name.trim(),
      amount: numAmount,
      billingCycle: billingCycle || 'monthly',
      category: category ? category.trim() : 'Entertainment',
      paymentMethod: paymentMethod ? paymentMethod.trim() : 'Credit Card',
      nextDueDate: new Date(nextDueDate),
      status: 'active',
      notes: notes ? notes.trim() : '',
    });

    return res.status(201).json({
      success: true,
      message: `${name} subscription added!`,
      data: newSub
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create subscription.'
    });
  }
};

// @desc    Update subscription
// @route   PUT /api/subscriptions/:id
exports.updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Subscription.findById(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }
    if (existing.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name.trim();
    if (req.body.amount !== undefined) {
      const amt = parseFloat(req.body.amount);
      if (isNaN(amt) || amt <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount.' });
      }
      updates.amount = amt;
    }
    if (req.body.billingCycle) updates.billingCycle = req.body.billingCycle;
    if (req.body.category) updates.category = req.body.category.trim();
    if (req.body.paymentMethod) updates.paymentMethod = req.body.paymentMethod.trim();
    if (req.body.nextDueDate) updates.nextDueDate = new Date(req.body.nextDueDate);
    if (req.body.status) updates.status = req.body.status;
    if (req.body.notes !== undefined) updates.notes = req.body.notes.trim();

    const updated = await Subscription.findByIdAndUpdate(id, updates, { new: true });

    return res.status(200).json({
      success: true,
      message: 'Subscription updated successfully!',
      data: updated
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update subscription.' });
  }
};

// @desc    Toggle subscription status (active/paused)
// @route   PATCH /api/subscriptions/:id/status
exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existing = await Subscription.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }
    if (existing.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const updated = await Subscription.findByIdAndUpdate(id, { status }, { new: true });

    return res.status(200).json({
      success: true,
      message: `Subscription marked as ${status}.`,
      data: updated
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to toggle status.' });
  }
};

// @desc    Delete subscription
// @route   DELETE /api/subscriptions/:id
exports.deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Subscription.findById(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }
    if (existing.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    await Subscription.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Subscription deleted.'
    });
  } catch (error) {
    console.error('Delete subscription error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete subscription.' });
  }
};
