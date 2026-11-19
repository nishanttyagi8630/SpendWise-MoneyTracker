// Budgets Page
// Set monthly limits per category, track actual spending, and view remaining balances.

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, CheckCircle, PieChart, Calendar } from 'lucide-react';
import Modal from '../components/Modal';
import { budgetApi } from '../services/api';
import { formatCurrency, EXPENSE_CATEGORIES } from '../utils/formatters';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteId, setDeleteId] = useState(null);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await budgetApi.getAll(selectedMonth, selectedYear);
      if (res.success) {
        setBudgets(res.data);
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth, selectedYear]);

  const openAddModal = () => {
    setEditingBudget(null);
    setCategory(EXPENSE_CATEGORIES[0]);
    setAmount('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (b) => {
    setEditingBudget(b);
    setCategory(b.category);
    setAmount(b.amount.toString());
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!amount || parseFloat(amount) <= 0) {
      setFormError('Please enter a valid monthly budget amount.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingBudget) {
        const id = editingBudget._id || editingBudget.id;
        await budgetApi.update(id, {
          category,
          amount: parseFloat(amount)
        });
      } else {
        await budgetApi.createOrUpdate({
          category,
          amount: parseFloat(amount),
          month: selectedMonth,
          year: selectedYear
        });
      }

      setIsModalOpen(false);
      fetchBudgets();
    } catch (err) {
      setFormError(err.message || 'Failed to save budget.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await budgetApi.delete(deleteId);
      setDeleteId(null);
      fetchBudgets();
    } catch (err) {
      console.error('Failed to delete budget:', err);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Budget Management
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Keep your spending under control with monthly category targets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
          >
            {monthNames.map((name, idx) => (
              <option key={name} value={idx + 1}>{name} {selectedYear}</option>
            ))}
          </select>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Set Budget</span>
          </button>
        </div>
      </div>

      {/* Overview Progress Card */}
      <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Monthly Budget Utilization ({monthNames[selectedMonth - 1]})
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[var(--text-primary)]">
                {formatCurrency(summary?.totalBudgetSpent || 0)}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                spent of {formatCurrency(summary?.totalBudgetLimit || 0)} limit
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              Remaining Safe to Spend:
            </span>
            <p className={`text-lg font-bold ${
              (summary?.totalRemaining || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'
            }`}>
              {formatCurrency(summary?.totalRemaining || 0)}
            </p>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-3 rounded-full bg-[var(--bg-card-subtle)] overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                (summary?.overallPercentage || 0) > 100
                  ? 'bg-rose-500'
                  : (summary?.overallPercentage || 0) > 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, summary?.overallPercentage || 0)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-[var(--text-secondary)] font-medium">
            <span>{summary?.overallPercentage || 0}% used</span>
            <span>{Math.max(0, 100 - (summary?.overallPercentage || 0))}% remaining</span>
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const bId = b._id || b.id;
            const isOver = b.isOverBudget;
            const isNear = b.percentage >= 80 && !isOver;

            return (
              <div
                key={bId}
                className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      {b.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(b)}
                        className="p-1 text-[var(--text-secondary)] hover:text-emerald-500 rounded-md"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(bId)}
                        className="p-1 text-[var(--text-secondary)] hover:text-rose-500 rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[var(--text-secondary)]">Spent</span>
                      <p className="text-base font-bold text-[var(--text-primary)]">
                        {formatCurrency(b.spent)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-[var(--text-secondary)]">Limit</span>
                      <p className="text-base font-bold text-[var(--text-secondary)]">
                        {formatCurrency(b.amount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-[var(--bg-card-subtle)] overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, b.percentage)}%` }}
                    />
                  </div>
                </div>

                {/* Footer status */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)] text-xs">
                  <span className="text-[var(--text-secondary)]">
                    {isOver ? (
                      <span className="text-rose-500 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Over by {formatCurrency(Math.abs(b.remaining))}
                      </span>
                    ) : (
                      <span>Remaining: <strong className="text-emerald-500">{formatCurrency(b.remaining)}</strong></span>
                    )}
                  </span>
                  <span className="font-bold text-[var(--text-secondary)]">
                    {b.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <PieChart className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            No Budgets Set For {monthNames[selectedMonth - 1]}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
            Setting category budgets helps prevent overspending and gives you clear visibility on your monthly limits.
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all shadow-sm"
          >
            Create Your First Budget
          </button>
        </div>
      )}

      {/* Add / Edit Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? 'Update Budget Limit' : 'Set Category Budget'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Category
            </label>
            <select
              value={category}
              disabled={Boolean(editingBudget)}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 disabled:opacity-60"
            >
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Monthly Budget Limit ($)
            </label>
            <input
              type="number"
              step="1"
              required
              placeholder="e.g. 500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
          </div>

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
              {submitting ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete Budget"
      >
        <p className="text-sm text-[var(--text-secondary)] mb-5">
          Are you sure you want to remove this category budget? Past transactions will remain intact.
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
    </div>
  );
}
