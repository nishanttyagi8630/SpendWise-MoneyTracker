// Savings Goals Page
// Create savings goals, set target amounts, and track progress.

import { useState, useEffect } from 'react';
import { Target, Plus, DollarSign, Calendar, CheckCircle2, Trophy, Edit2, Trash2, Sparkles } from 'lucide-react';
import Modal from '../components/Modal';
import { goalApi } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('Emergency');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Deposit Modal State
  const [depositGoal, setDepositGoal] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositError, setDepositError] = useState('');

  // Delete State
  const [deleteId, setDeleteId] = useState(null);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await goalApi.getAll();
      if (res.success) {
        setGoals(res.data);
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to load savings goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const openAddModal = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setDeadline('');
    setCategory('Emergency');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setDeadline(goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '');
    setCategory(goal.category || 'General');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Please enter a goal name.');
      return;
    }
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      setFormError('Please enter a valid target amount.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        deadline: deadline || null,
        category: category.trim(),
      };

      if (editingGoal) {
        const id = editingGoal._id || editingGoal.id;
        await goalApi.update(id, payload);
      } else {
        await goalApi.create(payload);
      }

      setIsModalOpen(false);
      fetchGoals();
    } catch (err) {
      setFormError(err.message || 'Failed to save goal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    setDepositError('');

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setDepositError('Please enter a positive contribution amount.');
      return;
    }

    try {
      setSubmitting(true);
      const id = depositGoal._id || depositGoal.id;
      await goalApi.contribute(id, parseFloat(depositAmount));
      setDepositGoal(null);
      setDepositAmount('');
      fetchGoals();
    } catch (err) {
      setDepositError(err.message || 'Failed to add deposit.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await goalApi.delete(deleteId);
      setDeleteId(null);
      fetchGoals();
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  const calculateDaysLeft = (deadlineDate) => {
    if (!deadlineDate) return null;
    const now = new Date();
    const target = new Date(deadlineDate);
    const diffTime = target - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Savings Goals
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Build your emergency fund, dream vacation, or big milestone purchases.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <span className="text-[11px] font-semibold uppercase text-[var(--text-secondary)]">
            Total Saved Towards Goals
          </span>
          <p className="text-2xl font-bold text-emerald-500 mt-1">
            {formatCurrency(summary?.totalSaved || 0)}
          </p>
          <span className="text-xs text-[var(--text-secondary)]">
            of {formatCurrency(summary?.totalTarget || 0)} target ({summary?.overallPercentage || 0}%)
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <span className="text-[11px] font-semibold uppercase text-[var(--text-secondary)]">
            Remaining to Reach Targets
          </span>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
            {formatCurrency(summary?.totalRemaining || 0)}
          </p>
          <span className="text-xs text-[var(--text-secondary)]">
            across all planned milestones
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <span className="text-[11px] font-semibold uppercase text-[var(--text-secondary)]">
            Goals Overview
          </span>
          <div className="flex items-center gap-4 mt-2">
            <div>
              <span className="text-xl font-bold text-emerald-500">
                {summary?.completedGoalsCount || 0}
              </span>
              <p className="text-[11px] text-[var(--text-secondary)]">Completed</p>
            </div>
            <div className="h-8 w-px bg-[var(--border-color)]" />
            <div>
              <span className="text-xl font-bold text-indigo-500">
                {summary?.activeGoalsCount || 0}
              </span>
              <p className="text-[11px] text-[var(--text-secondary)]">In Progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Goals Cards Grid */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal) => {
            const gId = goal._id || goal.id;
            const daysLeft = calculateDaysLeft(goal.deadline);
            const isFinished = goal.isCompleted;

            return (
              <div
                key={gId}
                className={`p-6 rounded-3xl bg-[var(--bg-card)] border transition-all duration-200 flex flex-col justify-between ${
                  isFinished 
                    ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-500/5 to-transparent' 
                    : 'border-[var(--border-color)] shadow-sm hover:shadow-md'
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-card-subtle)] text-emerald-500 border border-emerald-500/20">
                      {goal.category || 'Savings'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(goal)}
                        className="p-1.5 text-[var(--text-secondary)] hover:text-emerald-500 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(gId)}
                        className="p-1.5 text-[var(--text-secondary)] hover:text-rose-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Goal Title */}
                  <div className="flex items-center gap-2 mb-2">
                    {isFinished && <Trophy className="w-5 h-5 text-amber-400 shrink-0" />}
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                      {goal.name}
                    </h3>
                  </div>

                  {/* Saved vs Target */}
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[var(--text-secondary)]">Current</span>
                      <p className="text-xl font-extrabold text-emerald-500">
                        {formatCurrency(goal.currentAmount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-[var(--text-secondary)]">Target</span>
                      <p className="text-base font-bold text-[var(--text-secondary)]">
                        {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 rounded-full bg-[var(--bg-card-subtle)] overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFinished 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, goal.progressPercentage)}%` }}
                    />
                  </div>

                  {/* Percentage & Deadline indicator */}
                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-4">
                    <span className="font-semibold text-[var(--text-primary)]">
                      {goal.progressPercentage}% reached
                    </span>
                    {goal.deadline && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3" />
                        {daysLeft !== null && daysLeft >= 0 
                          ? `${daysLeft} days left` 
                          : 'Passed deadline'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="pt-3 border-t border-[var(--border-color)]">
                  {isFinished ? (
                    <div className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 rounded-xl">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Target Achieved!</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setDepositGoal(goal);
                        setDepositAmount('');
                        setDepositError('');
                      }}
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Deposit Money</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <Target className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            No Savings Goals Yet
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
            Create a goal to start saving for things that matter — whether it's an emergency safety net or an upcoming adventure.
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all shadow-sm"
          >
            Create Your First Goal
          </button>
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGoal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Goal Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Emergency Fund or Japan Trip"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Target Amount ($)
              </label>
              <input
                type="number"
                step="1"
                required
                placeholder="5000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Already Saved ($)
              </label>
              <input
                type="number"
                step="1"
                placeholder="0"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              >
                <option value="Emergency">Emergency</option>
                <option value="Travel">Travel</option>
                <option value="Tech">Tech</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Home">Home</option>
                <option value="Education">Education</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Target Date (Optional)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              />
            </div>
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
              {submitting ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deposit Modal */}
      <Modal
        isOpen={Boolean(depositGoal)}
        onClose={() => setDepositGoal(null)}
        title={`Deposit into ${depositGoal?.name || 'Goal'}`}
      >
        <form onSubmit={handleDepositSubmit} className="space-y-4">
          {depositError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
              {depositError}
            </div>
          )}

          <p className="text-xs text-[var(--text-secondary)]">
            Current balance: <strong className="text-emerald-500">{formatCurrency(depositGoal?.currentAmount || 0)}</strong> of {formatCurrency(depositGoal?.targetAmount || 0)} target.
          </p>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Deposit Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 100"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDepositGoal(null)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-card-subtle)] hover:bg-[var(--border-color)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-sm"
            >
              {submitting ? 'Adding...' : 'Confirm Deposit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete Savings Goal"
      >
        <p className="text-sm text-[var(--text-secondary)] mb-5">
          Are you sure you want to remove this savings goal?
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
