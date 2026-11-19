// Subscriptions & Recurring Bills Page
// Track recurring SaaS, streaming, gym, and rent with automated countdowns and monthly cash-flow burn.

import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Pause, 
  Play, 
  Trash2, 
  Edit2, 
  Zap, 
  TrendingUp, 
  Sparkles 
} from 'lucide-react';
import Modal from '../components/Modal';
import { subscriptionApi } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [upcomingBills, setUpcomingBills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    billingCycle: 'monthly',
    category: 'Entertainment',
    paymentMethod: 'Credit Card',
    nextDueDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete State
  const [deleteId, setDeleteId] = useState(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await subscriptionApi.getAll();
      if (res.success) {
        setSubscriptions(res.data);
        setSummary(res.summary);
        setUpcomingBills(res.upcoming7Days || []);
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const openAddModal = () => {
    setEditingSub(null);
    setFormData({
      name: '',
      amount: '',
      billingCycle: 'monthly',
      category: 'Entertainment',
      paymentMethod: 'Credit Card',
      nextDueDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (sub) => {
    setEditingSub(sub);
    const dateFormatted = sub.nextDueDate ? new Date(sub.nextDueDate).toISOString().split('T')[0] : '';
    setFormData({
      name: sub.name,
      amount: sub.amount,
      billingCycle: sub.billingCycle || 'monthly',
      category: sub.category || 'Entertainment',
      paymentMethod: sub.paymentMethod || 'Credit Card',
      nextDueDate: dateFormatted,
      notes: sub.notes || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Please enter subscription name.');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setFormError('Please enter a valid recurring amount.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        amount: parseFloat(formData.amount),
        billingCycle: formData.billingCycle,
        category: formData.category,
        paymentMethod: formData.paymentMethod,
        nextDueDate: formData.nextDueDate,
        notes: formData.notes,
      };

      if (editingSub) {
        const id = editingSub._id || editingSub.id;
        await subscriptionApi.update(id, payload);
      } else {
        await subscriptionApi.create(payload);
      }

      setIsModalOpen(false);
      fetchSubscriptions();
    } catch (err) {
      setFormError(err.message || 'Failed to save subscription.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (sub) => {
    try {
      const id = sub._id || sub.id;
      const nextStatus = sub.status === 'active' ? 'paused' : 'active';
      await subscriptionApi.toggleStatus(id, nextStatus);
      fetchSubscriptions();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await subscriptionApi.delete(deleteId);
      setDeleteId(null);
      fetchSubscriptions();
    } catch (err) {
      console.error('Failed to delete subscription:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <span>Subscriptions & Recurring Bills</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-500 border border-purple-500/20">
              Auto-Track
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Audit your active recurring subscriptions and forecast your fixed monthly burn.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subscription</span>
        </button>
      </div>

      {/* Upcoming Renewals Alert Banner */}
      {upcomingBills.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-500">
                {upcomingBills.length} Bill{upcomingBills.length > 1 ? 's' : ''} Due in Next 7 Days:
              </h4>
              <p className="text-xs text-[var(--text-primary)]">
                {upcomingBills.map(b => `${b.name} (${formatCurrency(b.amount)} on ${formatDate(b.nextDueDate)})`).join(' • ')}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white shrink-0">
            Action Recommended
          </span>
        </div>
      )}

      {/* Summary Highlight Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <span className="text-[11px] font-semibold uppercase text-[var(--text-secondary)]">
            Monthly Subscription Burn
          </span>
          <p className="text-2xl font-bold text-rose-500 mt-1">
            {formatCurrency(summary?.totalMonthlyBurn || 0)}/mo
          </p>
          <span className="text-xs text-[var(--text-secondary)]">
            Fixed committed recurring expenses
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <span className="text-[11px] font-semibold uppercase text-[var(--text-secondary)]">
            Annual Projection
          </span>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
            {formatCurrency(summary?.totalYearlyBurn || 0)}/yr
          </p>
          <span className="text-xs text-[var(--text-secondary)]">
            Projected total cost if retained
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <span className="text-[11px] font-semibold uppercase text-[var(--text-secondary)]">
            Subscription Status
          </span>
          <div className="flex items-center gap-4 mt-2">
            <div>
              <span className="text-xl font-bold text-emerald-500">{summary?.activeCount || 0}</span>
              <p className="text-[11px] text-[var(--text-secondary)]">Active</p>
            </div>
            <div className="h-8 w-px bg-[var(--border-color)]" />
            <div>
              <span className="text-xl font-bold text-amber-500">{summary?.pausedCount || 0}</span>
              <p className="text-[11px] text-[var(--text-secondary)]">Paused</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscriptions Grid */}
      {subscriptions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map((sub) => {
            const subId = sub._id || sub.id;
            const isActive = sub.status === 'active';

            return (
              <div
                key={subId}
                className={`p-5 rounded-3xl bg-[var(--bg-card)] border transition-all duration-200 flex flex-col justify-between ${
                  !isActive 
                    ? 'opacity-65 border-dashed border-[var(--border-color)]' 
                    : sub.isDueSoon 
                    ? 'border-amber-500/40 shadow-sm' 
                    : 'border-[var(--border-color)] shadow-sm hover:shadow-md'
                }`}
              >
                <div>
                  {/* Top line with Category & Actions */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                      {sub.category || 'General'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleStatus(sub)}
                        title={isActive ? 'Pause subscription' : 'Activate subscription'}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isActive 
                            ? 'text-amber-500 hover:bg-amber-500/10' 
                            : 'text-emerald-500 hover:bg-emerald-500/10'
                        }`}
                      >
                        {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => openEditModal(sub)}
                        title="Edit"
                        className="p-1.5 text-[var(--text-secondary)] hover:text-emerald-500 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(subId)}
                        title="Delete"
                        className="p-1.5 text-[var(--text-secondary)] hover:text-rose-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Cost */}
                  <div className="mb-2">
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      {sub.name}
                    </h3>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-xl font-extrabold text-[var(--text-primary)]">
                        {formatCurrency(sub.amount)}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)] font-medium">
                        / {sub.billingCycle}
                      </span>
                    </div>
                  </div>

                  {/* Payment Method & Renewal Indicator */}
                  <div className="space-y-1.5 my-3 text-xs">
                    <div className="flex items-center justify-between text-[var(--text-secondary)]">
                      <span>Payment Method:</span>
                      <span className="font-semibold text-[var(--text-primary)]">{sub.paymentMethod}</span>
                    </div>

                    <div className="flex items-center justify-between text-[var(--text-secondary)]">
                      <span>Next Renewal:</span>
                      <span className="font-semibold text-[var(--text-primary)]">{formatDate(sub.nextDueDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer Status */}
                <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="capitalize font-semibold text-[var(--text-secondary)]">
                      {sub.status}
                    </span>
                  </div>

                  {isActive && sub.daysUntilDue !== undefined && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      sub.isDueSoon 
                        ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30' 
                        : 'text-[var(--text-secondary)]'
                    }`}>
                      {sub.daysUntilDue === 0 
                        ? 'Renews Today!' 
                        : sub.daysUntilDue > 0 
                        ? `In ${sub.daysUntilDue} days` 
                        : 'Overdue'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <CreditCard className="w-12 h-12 text-purple-500/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            No Recurring Subscriptions Added
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
            Keep track of monthly software, streaming services, and memberships so you never get surprised by hidden renewal charges.
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all shadow-sm"
          >
            Add Your First Subscription
          </button>
        </div>
      )}

      {/* Add / Edit Subscription Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSub ? 'Edit Subscription' : 'Add Recurring Subscription'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Service / Tool Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Netflix, Spotify, Gym, ChatGPT"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="19.99"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Billing Cycle
              </label>
              <select
                value={formData.billingCycle}
                onChange={(e) => setFormData(prev => ({ ...prev, billingCycle: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              >
                <option value="Entertainment">Entertainment</option>
                <option value="Software">Software & Cloud</option>
                <option value="Healthcare">Healthcare & Gym</option>
                <option value="Utilities">Utilities & Wifi</option>
                <option value="Shopping">Shopping & Delivery</option>
                <option value="Education">Education & Courses</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="UPI">UPI</option>
                <option value="PayPal">PayPal</option>
                <option value="Bank Auto-Debit">Bank Auto-Debit</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Next Due / Renewal Date
            </label>
            <input
              type="date"
              required
              value={formData.nextDueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, nextDueDate: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Shared with roommate or cancels after promo"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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
              {submitting ? 'Saving...' : editingSub ? 'Update Subscription' : 'Save Subscription'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete Subscription"
      >
        <p className="text-sm text-[var(--text-secondary)] mb-5">
          Are you sure you want to remove this subscription from your active tracking?
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
