// Savings Goals Controller
// Manages creating savings goals, setting target amounts, and tracking progress.

const Goal = require('../models/Goal');

// @desc    Get all savings goals for logged-in user
// @route   GET /api/goals
exports.getGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    const goals = await Goal.find({ userId });

    let totalTarget = 0;
    let totalSaved = 0;

    const enrichedGoals = goals.map(g => {
      const target = Number(g.targetAmount) || 0;
      const current = Number(g.currentAmount) || 0;
      const remaining = Math.max(0, target - current);
      const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
      const isCompleted = current >= target;

      totalTarget += target;
      totalSaved += current;

      return {
        ...g,
        targetAmount: target,
        currentAmount: current,
        remainingAmount: Number(remaining.toFixed(2)),
        progressPercentage: percentage,
        isCompleted
      };
    });

    return res.status(200).json({
      success: true,
      summary: {
        totalTarget: Number(totalTarget.toFixed(2)),
        totalSaved: Number(totalSaved.toFixed(2)),
        totalRemaining: Number(Math.max(0, totalTarget - totalSaved).toFixed(2)),
        overallPercentage: totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0,
        activeGoalsCount: enrichedGoals.filter(g => !g.isCompleted).length,
        completedGoalsCount: enrichedGoals.filter(g => g.isCompleted).length
      },
      data: enrichedGoals
    });
  } catch (error) {
    console.error('Get goals error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve savings goals.'
    });
  }
};

// @desc    Create a new savings goal
// @route   POST /api/goals
exports.createGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, targetAmount, currentAmount, deadline, category } = req.body;

    if (!name || targetAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Goal name and target amount are required.'
      });
    }

    const numTarget = parseFloat(targetAmount);
    if (isNaN(numTarget) || numTarget <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Target amount must be a positive number.'
      });
    }

    const numCurrent = currentAmount !== undefined ? parseFloat(currentAmount) : 0;
    if (isNaN(numCurrent) || numCurrent < 0) {
      return res.status(400).json({
        success: false,
        message: 'Current amount cannot be negative.'
      });
    }

    const newGoal = await Goal.create({
      userId,
      name: name.trim(),
      targetAmount: numTarget,
      currentAmount: numCurrent,
      deadline: deadline ? new Date(deadline) : null,
      category: category ? category.trim() : 'General'
    });

    return res.status(201).json({
      success: true,
      message: 'Savings goal created successfully!',
      data: newGoal
    });
  } catch (error) {
    console.error('Create goal error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create savings goal.'
    });
  }
};

// @desc    Update a savings goal
// @route   PUT /api/goals/:id
exports.updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, targetAmount, currentAmount, deadline, category } = req.body;

    const existing = await Goal.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found.'
      });
    }

    if (existing.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to edit this savings goal.'
      });
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (targetAmount !== undefined) {
      const numTarget = parseFloat(targetAmount);
      if (isNaN(numTarget) || numTarget <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Target amount must be a positive number.'
        });
      }
      updates.targetAmount = numTarget;
    }
    if (currentAmount !== undefined) {
      const numCurrent = parseFloat(currentAmount);
      if (isNaN(numCurrent) || numCurrent < 0) {
        return res.status(400).json({
          success: false,
          message: 'Current amount cannot be negative.'
        });
      }
      updates.currentAmount = numCurrent;
    }
    if (deadline !== undefined) {
      updates.deadline = deadline ? new Date(deadline) : null;
    }
    if (category) updates.category = category.trim();

    const updated = await Goal.findByIdAndUpdate(id, updates, { new: true });

    return res.status(200).json({
      success: true,
      message: 'Savings goal updated successfully!',
      data: updated
    });
  } catch (error) {
    console.error('Update goal error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update savings goal.'
    });
  }
};

// @desc    Add deposit/contribution to a goal
// @route   POST /api/goals/:id/contribute
exports.contributeToGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Contribution amount must be a positive number.'
      });
    }

    const existing = await Goal.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found.'
      });
    }

    if (existing.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to contribute to this goal.'
      });
    }

    const newAmount = Number(existing.currentAmount || 0) + numAmount;
    const updated = await Goal.findByIdAndUpdate(id, { currentAmount: newAmount }, { new: true });

    return res.status(200).json({
      success: true,
      message: `Added $${numAmount.toFixed(2)} to ${existing.name}!`,
      data: updated
    });
  } catch (error) {
    console.error('Contribute to goal error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add deposit to savings goal.'
    });
  }
};

// @desc    Delete a savings goal
// @route   DELETE /api/goals/:id
exports.deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await Goal.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found.'
      });
    }

    if (existing.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this savings goal.'
      });
    }

    await Goal.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Savings goal deleted successfully.'
    });
  } catch (error) {
    console.error('Delete goal error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete savings goal.'
    });
  }
};
