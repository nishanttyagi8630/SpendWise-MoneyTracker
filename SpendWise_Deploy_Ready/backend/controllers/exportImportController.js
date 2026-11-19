// Export and Import Controller
// Handles CSV generation for transactions and batch ingestion of statement records.

const Transaction = require('../models/Transaction');

// @desc    Export user's transactions as a downloadable CSV file
// @route   GET /api/data/export/csv
exports.exportCSV = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, type } = req.query;

    let transactions = await Transaction.find({ userId });

    if (type && type !== 'all') {
      transactions = transactions.filter(t => t.type === type);
    }
    if (startDate) {
      const start = new Date(startDate);
      transactions = transactions.filter(t => new Date(t.date) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      transactions = transactions.filter(t => new Date(t.date) <= end);
    }

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Header row
    let csv = 'Date,Type,Category,Amount,Description\r\n';

    // Rows
    transactions.forEach(t => {
      const dateStr = new Date(t.date).toISOString().split('T')[0];
      const typeStr = t.type;
      const catStr = `"${(t.category || '').replace(/"/g, '""')}"`;
      const amtStr = Number(t.amount || 0).toFixed(2);
      const descStr = `"${(t.description || '').replace(/"/g, '""')}"`;

      csv += `${dateStr},${typeStr},${catStr},${amtStr},${descStr}\r\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="spendwise-export.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate CSV export.' });
  }
};

// @desc    Bulk import transactions from parsed CSV data
// @route   POST /api/data/import/csv
exports.importCSV = async (req, res) => {
  try {
    const userId = req.user.id;
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No records provided for import.'
      });
    }

    const validTransactions = [];
    const errors = [];

    records.forEach((row, index) => {
      const type = (row.type || 'expense').toLowerCase().trim();
      const amount = parseFloat(row.amount);
      const category = (row.category || 'Other').trim();
      const date = row.date ? new Date(row.date) : new Date();
      const description = (row.description || '').trim();

      if (type !== 'income' && type !== 'expense') {
        errors.push(`Row ${index + 1}: Type must be 'income' or 'expense'`);
        return;
      }

      if (isNaN(amount) || amount <= 0) {
        errors.push(`Row ${index + 1}: Amount must be a positive number`);
        return;
      }

      validTransactions.push({
        userId,
        type,
        amount,
        category: category || 'Other',
        date: isNaN(date.getTime()) ? new Date() : date,
        description,
      });
    });

    if (validTransactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid records found in the uploaded data.',
        errors,
      });
    }

    // Insert all valid records into database
    for (const item of validTransactions) {
      await Transaction.create(item);
    }

    return res.status(201).json({
      success: true,
      message: `Successfully imported ${validTransactions.length} transactions!`,
      importedCount: validTransactions.length,
      skippedCount: errors.length,
      errors: errors.slice(0, 5), // Return first 5 errors if any
    });
  } catch (error) {
    console.error('Import CSV error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to batch import transactions.'
    });
  }
};
