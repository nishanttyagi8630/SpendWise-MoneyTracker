// Split Bill Controller
// Manages shared expenses with friends/roommates (Splitwise-style logic)

const SplitBill = require('../models/SplitBill');

// @desc    Get all split bills with calculated "You are owed" and "You owe" totals
// @route   GET /api/splits
exports.getSplitBills = async (req, res) => {
  try {
    const userId = req.user.id;
    const bills = await SplitBill.find({ userId });

    let totalOwedToYou = 0;
    let totalYouOwe = 0;
    let settledCount = 0;
    let activeCount = 0;

    const enriched = bills.map(bill => {
      const isPaidByYou = bill.paidBy.toLowerCase() === 'you';
      let billOwedToYou = 0;
      let billYouOwe = 0;

      bill.participants.forEach(p => {
        const isSelf = p.name.toLowerCase() === 'you';
        if (isPaidByYou && !isSelf && !p.isPaid) {
          billOwedToYou += Number(p.share) || 0;
        } else if (!isPaidByYou && isSelf && !p.isPaid) {
          billYouOwe += Number(p.share) || 0;
        }
      });

      totalOwedToYou += billOwedToYou;
      totalYouOwe += billYouOwe;

      if (bill.isSettled) {
        settledCount++;
      } else {
        activeCount++;
      }

      return {
        ...bill,
        owedToYou: Number(billOwedToYou.toFixed(2)),
        youOwe: Number(billYouOwe.toFixed(2)),
      };
    });

    return res.status(200).json({
      success: true,
      summary: {
        totalOwedToYou: Number(totalOwedToYou.toFixed(2)),
        totalYouOwe: Number(totalYouOwe.toFixed(2)),
        netSettlementBalance: Number((totalOwedToYou - totalYouOwe).toFixed(2)),
        settledCount,
        activeCount,
      },
      data: enriched,
    });
  } catch (error) {
    console.error('Get split bills error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve split bills.'
    });
  }
};

// @desc    Create a new split bill
// @route   POST /api/splits
exports.createSplitBill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, totalAmount, category, date, paidBy, participants, notes } = req.body;

    if (!title || !totalAmount || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Title, total amount, and at least one participant are required.'
      });
    }

    const numTotal = parseFloat(totalAmount);
    if (isNaN(numTotal) || numTotal <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Total amount must be greater than zero.'
      });
    }

    // Check if all are already paid
    const allPaid = participants.every(p => p.isPaid === true);

    const newBill = await SplitBill.create({
      userId,
      title: title.trim(),
      totalAmount: numTotal,
      category: category ? category.trim() : 'Food & Dining',
      date: date ? new Date(date) : new Date(),
      paidBy: paidBy ? paidBy.trim() : 'You',
      participants,
      notes: notes ? notes.trim() : '',
      isSettled: allPaid,
    });

    return res.status(201).json({
      success: true,
      message: 'Split bill recorded successfully!',
      data: newBill
    });
  } catch (error) {
    console.error('Create split bill error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create split bill.'
    });
  }
};

// @desc    Toggle payment status for a specific participant in a split bill
// @route   PATCH /api/splits/:id/settle-participant
exports.settleParticipant = async (req, res) => {
  try {
    const { id } = req.params;
    const { participantIndex, isPaid } = req.body;

    const existing = await SplitBill.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Split bill not found.' });
    }
    if (existing.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const participants = [...existing.participants];
    if (participantIndex < 0 || participantIndex >= participants.length) {
      return res.status(400).json({ success: false, message: 'Invalid participant index.' });
    }

    participants[participantIndex].isPaid = Boolean(isPaid);
    const allPaid = participants.every(p => p.isPaid === true);

    const updated = await SplitBill.findByIdAndUpdate(
      id,
      { participants, isSettled: allPaid },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: `${participants[participantIndex].name}'s share updated!`,
      data: updated
    });
  } catch (error) {
    console.error('Settle participant error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update participant settlement.' });
  }
};

// @desc    Delete split bill
// @route   DELETE /api/splits/:id
exports.deleteSplitBill = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await SplitBill.findById(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Split bill not found.' });
    }
    if (existing.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    await SplitBill.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Split bill removed successfully.'
    });
  } catch (error) {
    console.error('Delete split bill error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete split bill.' });
  }
};
