// Transaction Controller
// Manages adding, viewing, editing, and deleting income and expenses.

const Transaction = require('../models/Transaction');

// @desc    Get all transactions for the logged-in user
// @route   GET /api/transactions
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, category, search, startDate, endDate } = req.query;

    // Fetch user's transactions
    let transactions = await Transaction.find({ userId });

    // Filter by type if provided (e.g. 'income' or 'expense')
    if (type && type !== 'all') {
      transactions = transactions.filter(t => t.type === type);
    }

    // Filter by category if provided
    if (category && category !== 'all') {
      transactions = transactions.filter(t => t.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by search text (in description or category)
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      transactions = transactions.filter(t => 
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        t.amount.toString().includes(q)
      );
    }

    // Filter by date range if provided
    if (startDate) {
      const start = new Date(startDate);
      transactions = transactions.filter(t => new Date(t.date) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      transactions = transactions.filter(t => new Date(t.date) <= end);
    }

    // Sort by date descending (newest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions.'
    });
  }
};

// @desc    Get single transaction by ID
// @route   GET /api/transactions/:id
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.'
      });
    }

    // Ensure the transaction belongs to the logged-in user
    if (transaction.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this transaction.'
      });
    }

    return res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get single transaction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction.'
    });
  }
};

// @desc    Create a new transaction
// @route   POST /api/transactions
exports.createTransaction = async (req, res) => {
  try {
    const { type, amount, category, date, description } = req.body;

    // Validation
    if (!type || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: 'Type, amount, and category are required.'
      });
    }

    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({
        success: false,
        message: 'Transaction type must be either "income" or "expense".'
      });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number greater than zero.'
      });
    }

    const newTransaction = await Transaction.create({
      userId: req.user.id,
      type,
      amount: numericAmount,
      category: category.trim(),
      date: date ? new Date(date) : new Date(),
      description: description ? description.trim() : ''
    });

    return res.status(201).json({
      success: true,
      message: 'Transaction added successfully!',
      data: newTransaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create transaction.'
    });
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, category, date, description } = req.body;

    const existing = await Transaction.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.'
      });
    }

    // Check user ownership
    if (existing.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to edit this transaction.'
      });
    }

    const updateFields = {};
    if (type) {
      if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({
          success: false,
          message: 'Type must be "income" or "expense".'
        });
      }
      updateFields.type = type;
    }

    if (amount !== undefined) {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a positive number.'
        });
      }
      updateFields.amount = numAmount;
    }

    if (category) updateFields.category = category.trim();
    if (date) updateFields.date = new Date(date);
    if (description !== undefined) updateFields.description = description.trim();

    const updated = await Transaction.findByIdAndUpdate(id, updateFields, { new: true });

    return res.status(200).json({
      success: true,
      message: 'Transaction updated successfully!',
      data: updated
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update transaction.'
    });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await Transaction.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.'
      });
    }

    // Ownership check
    if (existing.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this transaction.'
      });
    }

    await Transaction.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully.'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete transaction.'
    });
  }
};
