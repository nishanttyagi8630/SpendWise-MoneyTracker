// Transactions Page
// Add, edit, delete, search, and filter all user income and expenses.

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Calendar,
  X,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import Modal from '../components/Modal';
import { transactionApi, dataApi } from '../services/api';
import { 
  formatCurrency, 
  formatDate, 
  INCOME_CATEGORIES, 
  EXPENSE_CATEGORIES, 
  ALL_CATEGORIES 
} from '../utils/formatters';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: EXPENSE_CATEGORIES[0],
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState(null);

  // Bulk CSV Import States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  // Handle Export CSV
  const handleExportCSV = async () => {
    try {
      await dataApi.exportCSV();
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  // Parse CSV File Client-Side
  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError('');
    setImportSuccess('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') return;

        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
          setImportError('CSV must contain a header and at least one data row.');
          return;
        }

        // Expected header format: Date,Type,Category,Amount,Description
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 4) {
            rows.push({
              date: parts[0] || new Date().toISOString().split('T')[0],
              type: (parts[1] || 'expense').toLowerCase(),
              category: parts[2] || 'Other',
              amount: parseFloat(parts[3]) || 0,
              description: parts[4] || '',
            });
          }
        }

        if (rows.length === 0) {
          setImportError('Could not parse any valid rows. Please ensure standard CSV format.');
          return;
        }

        setParsedRows(rows);
      } catch (err) {
        setImportError('Failed to parse CSV file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Submit Bulk Ingestion
  const handleBatchImport = async () => {
    if (parsedRows.length === 0) return;
    try {
      setImporting(true);
      setImportError('');
      const res = await dataApi.importCSV(parsedRows);
      if (res.success) {
        setImportSuccess(res.message);
        setTimeout(() => {
          setIsImportModalOpen(false);
          setParsedRows([]);
          setImportSuccess('');
          fetchTransactions();
        }, 1200);
      }
    } catch (err) {
      setImportError(err.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  // Fetch transactions from backend
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await transactionApi.getAll({
        type: typeFilter,
        category: categoryFilter,
        search: searchTerm,
        startDate,
        endDate,
      });
      if (res.success) {
        setTransactions(res.data);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, categoryFilter, searchTerm, startDate, endDate]);

  const openAddModal = () => {
    setEditingTransaction(null);
    setFormData({
      type: 'expense',
      amount: '',
      category: EXPENSE_CATEGORIES[0],
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (tx) => {
    setEditingTransaction(tx);
    const dateFormatted = tx.date ? new Date(tx.date).toISOString().split('T')[0] : '';
    setFormData({
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      date: dateFormatted,
      description: tx.description || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleTypeToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      type,
      category: type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setFormError('Please enter a valid positive amount.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        description: formData.description,
      };

      if (editingTransaction) {
        const id = editingTransaction._id || editingTransaction.id;
        await transactionApi.update(id, payload);
      } else {
        await transactionApi.create(payload);
      }

      setIsModalOpen(false);
      fetchTransactions();
    } catch (err) {
      setFormError(err.message || 'Operation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await transactionApi.delete(deleteId);
      setDeleteId(null);
      fetchTransactions();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  // Calculate filtered totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Transactions
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Manage your daily expenses and income streams.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            title="Download CSV"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-card-subtle)] transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setIsImportModalOpen(true);
              setParsedRows([]);
              setImportError('');
              setImportSuccess('');
            }}
            title="Upload CSV statement"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-card-subtle)] transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-blue-500" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filtered Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <span className="text-[11px] font-semibold uppercase text-[var(--text-secondary)]">
            Filtered Income
          </span>
          <p className="text-xl font-bold text-emerald-500 mt-0.5">
            +{formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <span className="text-[11px] font-semibold uppercase text-[var(--text-secondary)]">
            Filtered Expenses
          </span>
          <p className="text-xl font-bold text-rose-500 mt-0.5">
            -{formatCurrency(totalExpense)}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <span className="text-[11px] font-semibold uppercase text-[var(--text-secondary)]">
            Net for Selection
          </span>
          <p className={`text-xl font-bold mt-0.5 ${netBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {formatCurrency(netBalance)}
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Type Toggle */}
          <div className="flex p-0.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)]">
            {['all', 'income', 'expense'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                  typeFilter === t
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Categories</option>
              {ALL_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Date range filters */}
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Start Date"
              className="w-1/2 px-2 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="End Date"
              className="w-1/2 px-2 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Clear filters shortcut if active */}
        {(typeFilter !== 'all' || categoryFilter !== 'all' || searchTerm || startDate || endDate) && (
          <div className="flex items-center justify-between text-xs pt-1 text-[var(--text-secondary)]">
            <span>Showing {transactions.length} matching transactions</span>
            <button
              onClick={() => {
                setTypeFilter('all');
                setCategoryFilter('all');
                setSearchTerm('');
                setStartDate('');
                setEndDate('');
              }}
              className="text-emerald-500 hover:underline font-semibold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm overflow-hidden">
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--bg-card-subtle)]/30">
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-xs sm:text-sm">
                {transactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const txId = tx._id || tx.id;

                  return (
                    <tr key={txId} className="hover:bg-[var(--bg-card-subtle)]/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isIncome 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}>
                          {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                        {tx.description || tx.category}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-medium bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-[var(--text-secondary)]">
                        {formatDate(tx.date)}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold text-sm ${
                        isIncome ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(tx)}
                            title="Edit"
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(txId)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              No transactions found matching your criteria.
            </p>
            <button
              onClick={openAddModal}
              className="mt-3 px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-all"
            >
              Add New Transaction
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
              {formError}
            </div>
          )}

          {/* Type Toggle */}
          <div className="flex p-1 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => handleTypeToggle('expense')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                formData.type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeToggle('income')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                formData.type === 'income'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            >
              {(formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Electric utility bill"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-card-subtle)] hover:bg-[var(--border-color)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-sm"
            >
              {submitting ? 'Saving...' : editingTransaction ? 'Update Transaction' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete Transaction"
      >
        <p className="text-sm text-[var(--text-secondary)] mb-5">
          Are you sure you want to permanently delete this transaction? This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setDeleteId(null)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-card-subtle)] hover:bg-[var(--border-color)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-sm"
          >
            Delete
          </button>
        </div>
      </Modal>

      {/* CSV Bulk Ingestion Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Batch Import Transactions (CSV)"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-secondary)]">
            Upload your bank statement or CSV export. Expected columns:{' '}
            <code className="text-emerald-500 font-mono bg-emerald-500/10 px-1 py-0.5 rounded">
              Date,Type,Category,Amount,Description
            </code>
          </p>

          {importError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
              {importError}
            </div>
          )}

          {importSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{importSuccess}</span>
            </div>
          )}

          {/* File input drag/drop box */}
          <div className="p-6 border-2 border-dashed border-[var(--border-color)] rounded-2xl text-center hover:border-emerald-500 transition-colors">
            <FileSpreadsheet className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <label className="block text-xs font-bold text-[var(--text-primary)] cursor-pointer">
              <span>Choose a CSV file</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
              />
            </label>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">
              Supports standard bank and spreadsheet CSV files
            </p>
          </div>

          {/* Preview Table if rows parsed */}
          {parsedRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  Preview ({parsedRows.length} rows detected):
                </span>
                <span className="text-[11px] text-emerald-500 font-semibold">
                  Ready to ingest
                </span>
              </div>

              <div className="max-h-40 overflow-y-auto border border-[var(--border-color)] rounded-xl text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] sticky top-0">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Category</th>
                      <th className="p-2 text-right">Amount</th>
                      <th className="p-2">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {parsedRows.slice(0, 10).map((r, i) => (
                      <tr key={i} className="hover:bg-[var(--bg-card-subtle)]/50">
                        <td className="p-2">{r.date}</td>
                        <td className={`p-2 capitalize font-bold ${r.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {r.type}
                        </td>
                        <td className="p-2">{r.category}</td>
                        <td className="p-2 text-right font-bold">${r.amount}</td>
                        <td className="p-2 truncate max-w-[120px]">{r.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 10 && (
                <p className="text-[10px] text-[var(--text-secondary)] text-right mt-1">
                  + {parsedRows.length - 10} more rows
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-card-subtle)] hover:bg-[var(--border-color)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBatchImport}
              disabled={importing || parsedRows.length === 0}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              {importing ? 'Importing...' : `Import ${parsedRows.length} Transactions`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
