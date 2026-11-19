// Split Bills & Group Expenses Page
// Splitwise-style expense sharing with friends & roommates, settlement tracking, and net debt calculations.

import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Check, 
  UserPlus, 
  X,
  Sparkles
} from 'lucide-react';
import Modal from '../components/Modal';
import { splitBillApi } from '../services/api';
import { formatCurrency, formatDate, ALL_CATEGORIES } from '../utils/formatters';

export default function SplitBillsPage() {
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidBy, setPaidBy] = useState('You');
  const [notes, setNotes] = useState('');
  const [participants, setParticipants] = useState([
    { name: 'You', share: '', isPaid: true },
    { name: 'Friend 1', share: '', isPaid: false }
  ]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteId, setDeleteId] = useState(null);

  const fetchSplitBills = async () => {
    try {
      setLoading(true);
      const res = await splitBillApi.getAll();
      if (res.success) {
        setBills(res.data);
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to load split bills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSplitBills();
  }, []);

  const openAddModal = () => {
    setTitle('');
    setTotalAmount('');
    setCategory('Food & Dining');
    setDate(new Date().toISOString().split('T')[0]);
    setPaidBy('You');
    setNotes('');
    setParticipants([
      { name: 'You', share: '', isPaid: true },
      { name: 'Friend 1', share: '', isPaid: false }
    ]);
    setFormError('');
    setIsModalOpen(true);
  };

  // Helper to split equally across participants
  const handleSplitEqually = () => {
    const total = parseFloat(totalAmount);
    if (isNaN(total) || total <= 0) {
      setFormError('Please enter total amount first to calculate equal split.');
      return;
    }
    const count = participants.length;
    if (count === 0) return;

    const equalShare = Number((total / count).toFixed(2));
    setParticipants(prev => prev.map((p, idx) => {
      // Last person takes remainder to avoid rounding gap
      if (idx === count - 1) {
        const remainder = Number((total - (equalShare * (count - 1))).toFixed(2));
        return { ...p, share: remainder.toString() };
      }
      return { ...p, share: equalShare.toString() };
    }));
    setFormError('');
  };

  const handleAddParticipant = () => {
    setParticipants(prev => [
      ...prev,
      { name: `Friend ${prev.length}`, share: '', isPaid: false }
    ]);
  };

  const handleRemoveParticipant = (index) => {
    if (participants.length <= 2) return;
    setParticipants(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleParticipantChange = (index, field, value) => {
    setParticipants(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Please provide a title for the shared expense.');
      return;
    }

    const numTotal = parseFloat(totalAmount);
    if (isNaN(numTotal) || numTotal <= 0) {
      setFormError('Please enter a valid total amount.');
      return;
    }

    // Validate participant shares
    let sumShares = 0;
    for (const p of participants) {
      if (!p.name.trim()) {
        setFormError('All participants must have a name.');
        return;
      }
      const shareVal = parseFloat(p.share);
      if (isNaN(shareVal) || shareVal <= 0) {
        setFormError(`Please specify a valid share for ${p.name}. Click "Split Equally" for automatic calculation.`);
        return;
      }
      sumShares += shareVal;
    }

    // Small rounding tolerance of 0.05
    if (Math.abs(sumShares - numTotal) > 0.05) {
      setFormError(`The sum of shares ($${sumShares.toFixed(2)}) must equal total bill ($${numTotal.toFixed(2)}).`);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        totalAmount: numTotal,
        category,
        date,
        paidBy: paidBy.trim(),
        notes,
        participants: participants.map(p => ({
          name: p.name.trim(),
          share: parseFloat(p.share),
          isPaid: Boolean(p.isPaid),
        }))
      };

      await splitBillApi.create(payload);
      setIsModalOpen(false);
      fetchSplitBills();
    } catch (err) {
      setFormError(err.message || 'Failed to create split bill.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle paid status for an individual participant
  const handleToggleParticipant = async (billId, participantIndex, currentIsPaid) => {
    try {
      await splitBillApi.settleParticipant(billId, participantIndex, !currentIsPaid);
      fetchSplitBills();
    } catch (err) {
      console.error('Failed to toggle settlement:', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await splitBillApi.delete(deleteId);
      setDeleteId(null);
      fetchSplitBills();
    } catch (err) {
      console.error('Failed to delete bill:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <span>Split Expenses & Shared Bills</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Splitwise Style
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Easily split dinner, trips, rent, and groceries with friends & track settlements.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Split a Bill</span>
        </button>
      </div>

      {/* Debt Settlement Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-[var(--text-secondary)]">
              You Are Owed
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-500 mt-1">
            +{formatCurrency(summary?.totalOwedToYou || 0)}
          </p>
          <span className="text-xs text-[var(--text-secondary)]">
            Pending payments from friends
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-[var(--text-secondary)]">
              You Owe
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-500 mt-1">
            -{formatCurrency(summary?.totalYouOwe || 0)}
          </p>
          <span className="text-xs text-[var(--text-secondary)]">
            Pending share you need to pay
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <span className="text-[11px] font-semibold uppercase text-[var(--text-secondary)]">
            Settlement Net Position
          </span>
          <p className={`text-2xl font-bold mt-1 ${
            (summary?.netSettlementBalance || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'
          }`}>
            {formatCurrency(summary?.netSettlementBalance || 0)}
          </p>
          <span className="text-xs text-[var(--text-secondary)]">
            {summary?.activeCount || 0} active • {summary?.settledCount || 0} fully settled
          </span>
        </div>
      </div>

      {/* Split Bills List */}
      {bills.length > 0 ? (
        <div className="space-y-4">
          {bills.map((bill) => {
            const billId = bill._id || bill.id;
            const paidCount = bill.participants.filter(p => p.isPaid).length;
            const totalCount = bill.participants.length;
            const isSettled = bill.isSettled;

            return (
              <div
                key={billId}
                className={`p-6 rounded-3xl bg-[var(--bg-card)] border transition-all duration-200 ${
                  isSettled 
                    ? 'border-[var(--border-color)] opacity-75' 
                    : 'border-[var(--border-color)] shadow-sm hover:shadow-md'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                        {bill.category}
                      </span>
                      {isSettled ? (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Fully Settled</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{paidCount}/{totalCount} Settled</span>
                        </span>
                      )}
                      <span className="text-xs text-[var(--text-secondary)]">
                        • {formatDate(bill.date)}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                      {bill.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Paid initially by: <strong className="text-[var(--text-primary)]">{bill.paidBy}</strong>
                    </p>
                  </div>

                  {/* Bill Total & Delete Action */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-[var(--text-secondary)] block">Total Bill</span>
                      <span className="text-xl font-extrabold text-[var(--text-primary)]">
                        {formatCurrency(bill.totalAmount)}
                      </span>
                    </div>

                    <button
                      onClick={() => setDeleteId(billId)}
                      title="Delete bill"
                      className="p-2 text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Participants Split Breakdown Chips */}
                <div className="pt-3 border-t border-[var(--border-color)]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block mb-2.5">
                    Individual Participant Shares (Click to toggle paid / settled):
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {bill.participants.map((p, idx) => {
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleToggleParticipant(billId, idx, p.isPaid)}
                          className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            p.isPaid
                              ? 'bg-emerald-500/10 border-emerald-500/25 text-[var(--text-primary)]'
                              : 'bg-[var(--bg-card-subtle)] border-[var(--border-color)] hover:border-emerald-500/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                              p.isPaid 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-[var(--border-color)] text-[var(--text-secondary)]'
                            }`}>
                              {p.isPaid ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold block truncate text-[var(--text-primary)]">
                                {p.name}
                              </span>
                              <span className="text-[10px] text-[var(--text-secondary)]">
                                {p.isPaid ? 'Settled' : 'Unpaid'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-extrabold text-[var(--text-primary)] block">
                              {formatCurrency(p.share)}
                            </span>
                            <span className={`text-[10px] font-bold ${
                              p.isPaid ? 'text-emerald-500' : 'text-amber-500'
                            }`}>
                              {p.isPaid ? 'Paid ✓' : 'Mark Paid'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <Users className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            No Shared Bills Recorded Yet
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
            Split dinners, road trips, groceries, and flat utilities with friends. Track who paid and who owes what with 1 click!
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all shadow-sm"
          >
            Create Your First Split Bill
          </button>
        </div>
      )}

      {/* Add Split Bill Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Split a Shared Bill"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Expense Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Goa Villa Booking, Weekend Dinner, Wifi Bill"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Total Bill Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="300.00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Paid Initially By
              </label>
              <input
                type="text"
                required
                placeholder="e.g. You or Friend's Name"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
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
                {ALL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Dynamic Participants Section */}
          <div className="pt-2 border-t border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[var(--text-primary)]">
                Participants & Shares
              </label>
              <button
                type="button"
                onClick={handleSplitEqually}
                className="text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Split Equally</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {participants.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Name"
                    value={p.name}
                    onChange={(e) => handleParticipantChange(idx, 'name', e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  />
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Share"
                      value={p.share}
                      onChange={(e) => handleParticipantChange(idx, 'share', e.target.value)}
                      className="w-full pl-6 pr-2 py-1.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 font-semibold"
                    />
                  </div>
                  <label className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={p.isPaid}
                      onChange={(e) => handleParticipantChange(idx, 'isPaid', e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>Paid</span>
                  </label>
                  {participants.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(idx)}
                      className="p-1 text-[var(--text-secondary)] hover:text-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddParticipant}
              className="mt-2 text-xs font-semibold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add another friend</span>
            </button>
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
              {submitting ? 'Saving...' : 'Record Split Bill'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete Split Bill"
      >
        <p className="text-sm text-[var(--text-secondary)] mb-5">
          Are you sure you want to remove this shared bill?
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
