// Analytics Page
// In-depth financial charts and statistics using Recharts and real database records.

import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieIcon, 
  BarChart3, 
  Activity, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

import { analyticsApi } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const PALETTE = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b', '#14b8a6'];

export default function AnalyticsPage() {
  const [summary, setSummary] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [sumRes, monthRes, catRes, healthRes] = await Promise.all([
          analyticsApi.getSummary(),
          analyticsApi.getMonthly(),
          analyticsApi.getCategories(),
          analyticsApi.getFinancialHealth(),
        ]);

        if (sumRes.success) setSummary(sumRes.data);
        if (monthRes.success) setMonthlyData(monthRes.data);
        if (catRes.success) setCategories(catRes.data);
        if (healthRes.success) setHealthData(healthRes.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Financial Analytics & Health Score
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
          Heuristic algorithm evaluating your liquidity runway, budget discipline, and spending stability.
        </p>
      </div>

      {/* Comprehensive Financial Health & Emergency Runway Card */}
      {healthData && (
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-[var(--border-color)]">
            {/* Score Ring & Rating */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex flex-col items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                <span className="text-2xl font-extrabold leading-none">{healthData.score}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">/ 100</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Grade {healthData.gradeBadge}
                  </span>
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">
                    Algorithmic Health Rating
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {healthData.grade}
                </h3>
              </div>
            </div>

            {/* Emergency Runway Spotlight */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)]">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                  Emergency Survival Runway
                </span>
                <p className="text-lg font-extrabold text-[var(--text-primary)]">
                  {healthData.emergencyRunwayMonths} Months
                </p>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  At avg monthly burn of {formatCurrency(healthData.monthlyBurnRate)}
                </span>
              </div>
            </div>
          </div>

          {/* 4 Pillars Breakdown */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
              4-Pillar Score Composition:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(healthData.pillars).map(([key, pillar]) => {
                const percent = Math.round((pillar.score / pillar.max) * 100);
                return (
                  <div key={key} className="p-3.5 rounded-2xl bg-[var(--bg-card-subtle)]/70 border border-[var(--border-color)]">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-[var(--text-primary)] truncate">{pillar.label}</span>
                      <strong className="text-emerald-500">{pillar.score}/{pillar.max}</strong>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--border-color)] overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs">
            <span className="font-bold text-emerald-500 block mb-1">
              💡 Smart Algorithm Advice:
            </span>
            <ul className="list-disc list-inside space-y-1 text-[var(--text-primary)]">
              {healthData.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Primary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <span>Monthly Cash Flow (Income vs Expense)</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Comparison across the last 6 months
            </p>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-card)', 
                      borderColor: 'var(--border-color)', 
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: 'var(--text-primary)'
                    }} 
                    formatter={(v) => [`$${v}`, '']}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[var(--text-secondary)]">
                No monthly transactions recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Monthly Net Savings Trend Area Chart */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              <span>Net Savings Trend</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Monthly retained surplus (Income minus Expenses)
            </p>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-card)', 
                      borderColor: 'var(--border-color)', 
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: 'var(--text-primary)'
                    }} 
                    formatter={(v) => [`$${v}`, '']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="savings" 
                    name="Net Savings" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#savingsGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[var(--text-secondary)]">
                No savings trend data yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Pie Chart */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-purple-500" />
              <span>Category Share</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Expenses by category
            </p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {categories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
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
                    formatter={(v) => [`$${v}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-[var(--text-secondary)]">
                No expense categories yet.
              </div>
            )}
          </div>
        </div>

        {/* Detailed Category Table */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Top Expense Categories
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Where your money is going
            </p>
          </div>

          {categories.length > 0 ? (
            <div className="space-y-3.5">
              {categories.map((cat, idx) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: PALETTE[idx % PALETTE.length] }} 
                      />
                      <span className="text-[var(--text-primary)]">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--text-primary)]">
                        {formatCurrency(cat.value)}
                      </span>
                      <span className="text-[11px] text-[var(--text-secondary)]">
                        ({cat.percentage}%)
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[var(--bg-card-subtle)] overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${cat.percentage}%`, 
                        backgroundColor: PALETTE[idx % PALETTE.length] 
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[var(--text-secondary)]">
              No expenses recorded to rank categories.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
