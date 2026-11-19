// Budget Controller
// Handles setting monthly budgets, tracking category spending, and computing remaining limits.

const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

// @desc    Get all budgets for current user with spending calculations
// @route   GET /api/budgets
exports.getBudgets = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const currentMonth = parseInt(req.query.month) || (now.getMonth() + 1);
    const currentYear = parseInt(req.query.year) || now.getFullYear();

    // Fetch user's budgets for this month/year
    const budgets = await Budget.find({
      userId,
      month: currentMonth,
      year: currentYear
    });

    // Fetch user's expenses for this month/year to calculate spent amounts
    const allTransactions = await Transaction.find({ userId, type: 'expense' });
    
    // Filter transactions to matching month and year
    const monthExpenses = allTransactions.filter(t => {
      const d = new Date(t.date);
      return (d.getMonth() + 1) === currentMonth && d.getFullYear() === currentYear;
    });

    // Calculate spent per category
    const categorySpending = {};
    let totalExpenseThisMonth = 0;

    monthExpenses.forEach(t => {
      const cat = t.category.toLowerCase().trim();
      categorySpending[cat] = (categorySpending[cat] || 0) + Number(t.amount);
      totalExpenseThisMonth += Number(t.amount);
    });

    // Enrich budgets with actual spent, remaining, and percentage
    let totalBudgetLimit = 0;
    let totalBudgetSpent = 0;

    const enrichedBudgets = budgets.map(b => {
      const catKey = b.category.toLowerCase().trim();
      const spent = categorySpending[catKey] || 0;
      const remaining = Number((b.amount - spent).toFixed(2));
      const percent = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;

      totalBudgetLimit += Number(b.amount);
      totalBudgetSpent += spent;

      return {
        ...b,
        spent: Number(spent.toFixed(2)),
        remaining,
        percentage: percent,
        isOverBudget: spent > b.amount
      };
    });

    return res.status(200).json({
      success: true,
      month: currentMonth,
      year: currentYear,
      summary: {
        totalBudgetLimit: Number(totalBudgetLimit.toFixed(2)),
        totalBudgetSpent: Number(totalBudgetSpent.toFixed(2)),
        totalRemaining: Number((totalBudgetLimit - totalBudgetSpent).toFixed(2)),
        overallPercentage: totalBudgetLimit > 0 ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100) : 0
      },
      data: enrichedBudgets
    });
  } catch (error) {
    console.error('Get budgets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve budgets.'
    });
  }
};

// @desc    Create or update a budget limit
// @route   POST /api/budgets
exports.createOrUpdateBudget = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, amount, month, year } = req.body;

    if (!category || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Category and budget limit amount are required.'
      });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Budget limit amount must be a positive number.'
      });
    }

    const now = new Date();
    const budgetMonth = month ? parseInt(month) : (now.getMonth() + 1);
    const budgetYear = year ? parseInt(year) : now.getFullYear();

    // Check if budget already exists for this category/month/year
    const existing = await Budget.findOne({
      userId,
      category: category.trim(),
      month: budgetMonth,
      year: budgetYear
    });

    if (existing) {
      // Update existing budget limit
      const updated = await Budget.findByIdAndUpdate(
        existing._id || existing.id,
        { amount: numAmount },
        { new: true }
      );
      return res.status(200).json({
        success: true,
        message: `Budget limit for ${category} updated to $${numAmount}`,
        data: updated
      });
    }

    // Create new budget entry
    const newBudget = await Budget.create({
      userId,
      category: category.trim(),
      amount: numAmount,
      month: budgetMonth,
      year: budgetYear
    });

    return res.status(201).json({
      success: true,
      message: `Budget for ${category} created successfully!`,
      data: newBudget
    });
  } catch (error) {
    console.error('Create budget error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save budget.'
    });
  }
};

// @desc    Update budget amount
// @route   PUT /api/budgets/:id
exports.updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category } = req.body;

    const existing = await Budget.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Budget record not found.'
      });
    }

    if (existing.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to modify this budget.'
      });
    }

    const updates = {};
    if (amount !== undefined) {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Budget amount must be a positive number.'
        });
      }
      updates.amount = numAmount;
    }
    if (category) {
      updates.category = category.trim();
    }

    const updated = await Budget.findByIdAndUpdate(id, updates, { new: true });

    return res.status(200).json({
      success: true,
      message: 'Budget updated successfully!',
      data: updated
    });
  } catch (error) {
    console.error('Update budget error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update budget.'
    });
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
exports.deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await Budget.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found.'
      });
    }

    if (existing.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this budget.'
      });
    }

    await Budget.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Budget deleted successfully.'
    });
  } catch (error) {
    console.error('Delete budget error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete budget.'
    });
  }
};
