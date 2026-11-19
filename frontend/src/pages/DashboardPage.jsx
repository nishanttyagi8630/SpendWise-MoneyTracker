// Dashboard Page
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Plus, 
  ArrowRight, 
  Calendar,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import { analyticsApi, transactionApi, budgetApi } from '../services/api';
import { formatCurrency, formatDate, ALL_CATEGORIES, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/formatters';

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Add Transaction Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [txType, setTxType] = useState('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txDescription, setTxDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, monthRes, catRes, recRes, budRes] = await Promise.all([
        analyticsApi.getSummary(),
        analyticsApi.getMonthly(),
        analyticsApi.getCategories(),
        analyticsApi.getRecent(),
        budgetApi.getAll(),
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (monthRes.success) setMonthlyData(monthRes.data);
      if (catRes.success) setCategoryData(catRes.data);
      if (recRes.success) setRecentTransactions(recRes.data);
      if (budRes.success) setBudgets(budRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTypeChange = (newType) => {
    setTxType(newType);
    setTxCategory(newType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!txAmount || parseFloat(txAmount) <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }

    try {
      setSubmitting(true);
      await transactionApi.create({
        type: txType,
        amount: parseFloat(txAmount),
        category: txCategory,
        date: txDate,
        description: txDescription,
      });

      // Reset form & close modal
      setIsAddModalOpen(false);
      setTxAmount('');
      setTxDescription('');
      
      // Refresh real dashboard data
      fetchDashboardData();
    } catch (err) {
      setFormError(err.message || 'Failed to add transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  // Find any budget items that are close to or exceeding limits
  const budgetAlerts = budgets.filter(b => b.percentage >= 80);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-600/15 via-teal-500/10 to-transparent border border-emerald-500/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Personal Finance</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Financial Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            Real-time tracking of your income, expenses, and savings.
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 font-bold border border-emerald-500/25">
              Runway: {summary?.emergencyRunwayMonths || 0} Months
            </span>
            <span className="text-[var(--text-secondary)]">
              Avg Monthly Burn: <strong className="text-[var(--text-primary)]">{formatCurrency(summary?.monthlyBurnRate || 0)}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Balance"
          value={formatCurrency(summary?.totalBalance || 0)}
          icon={DollarSign}
          color="emerald"
          subtitle="Net cash on hand"
        />
        <StatCard
          title="Total Income"
          value={formatCurrency(summary?.totalIncome || 0)}
          icon={TrendingUp}
          color="blue"
          subtitle={`This Month: ${formatCurrency(summary?.thisMonthIncome || 0)}`}
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(summary?.totalExpense || 0)}
          icon={TrendingDown}
          color="rose"
          subtitle={`This Month: ${formatCurrency(summary?.thisMonthExpense || 0)}`}
        />
        <StatCard
          title="Savings Rate"
          value={`${summary?.savingsRate || 0}%`}
          icon={PiggyBank}
          color="purple"
          subtitle={`Monthly Savings: ${formatCurrency(summary?.thisMonthSavings || 0)}`}
        />
      </div>

      {/* Budget Alerts Notice if any */}
      {budgetAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm flex-1">
            <span className="font-bold text-amber-500">Budget Warning: </span>
            <span className="text-[var(--text-primary)]">
              {budgetAlerts.map(b => `${b.category} (${b.percentage}% spent)`).join(', ')}.
            </span>
            <Link to="/budgets" className="ml-2 font-semibold text-amber-500 underline">
              View Budgets
            </Link>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expense Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Income vs Expenses
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Last 6 months comparison
              </p>
            </div>
            <Link 
              to="/analytics" 
              className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="month" 
                    stroke="var(--text-secondary)" 
                    fontSize={11} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="var(--text-secondary)" 
                    fontSize={11} 
                    tickLine={false} 
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-card)', 
                      borderColor: 'var(--border-color)', 
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: 'var(--text-primary)'
                    }} 
                    formatter={(val) => [`$${val}`, '']}
                  />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[var(--text-secondary)]">
                No monthly data recorded yet. Add transactions to see chart!
              </div>
            )}
          </div>
        </div>

        {/* Expenses by Category Donut Chart */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Spending by Category
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Distribution of expenses
            </p>
          </div>

          <div className="h-56 sm:h-64 w-full flex-1 flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-card)', 
                      borderColor: 'var(--border-color)', 
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: 'var(--text-primary)'
                    }}
                    formatter={(val) => [`$${val}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-[var(--text-secondary)]">
                No expense categories yet.
              </div>
            )}
          </div>

          {/* Quick list of top categories */}
          {categoryData.length > 0 && (
            <div className="space-y-1.5 mt-2 pt-3 border-t border-[var(--border-color)]">
              {categoryData.slice(0, 3).map((cat, idx) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} 
                    />
                    <span className="text-[var(--text-secondary)]">{cat.name}</span>
                  </div>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {formatCurrency(cat.value)} ({cat.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Recent Transactions
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Latest financial activities
            </p>
          </div>
          <Link 
            to="/transactions" 
            className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-xs sm:text-sm">
                {recentTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  return (
                    <tr key={tx._id || tx.id} className="hover:bg-[var(--bg-card-subtle)]/40 transition-colors">
                      <td className="py-3 px-3 font-medium text-[var(--text-primary)]">
                        {tx.description || tx.category}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-medium bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-[var(--text-secondary)]">
                        {formatDate(tx.date)}
                      </td>
                      <td className={`py-3 px-3 text-right font-bold ${
                        isIncome ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              No transactions added yet.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-3 px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-all"
            >
              Add Your First Transaction
            </button>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Transaction"
      >
        <form onSubmit={handleAddTransaction} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
              {formError}
            </div>
          )}

          {/* Type Toggle */}
          <div className="flex p-1 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                txType === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                txType === 'income'
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
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Category
            </label>
            <select
              value={txCategory}
              onChange={(e) => setTxCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            >
              {(txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
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
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
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
              placeholder="e.g. Weekly grocery run"
              value={txDescription}
              onChange={(e) => setTxDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-card-subtle)] hover:bg-[var(--border-color)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-sm"
            >
              {submitting ? 'Saving...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
