// StatCard Component
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendLabel, 
  color = 'emerald',
  subtitle
}) {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      glow: 'shadow-emerald-500/10',
    },
    blue: {
      bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      glow: 'shadow-blue-500/10',
    },
    rose: {
      bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      glow: 'shadow-rose-500/10',
    },
    purple: {
      bg: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      glow: 'shadow-purple-500/10',
    },
    amber: {
      bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      glow: 'shadow-amber-500/10',
    },
  };

  const scheme = colorMap[color] || colorMap.emerald;

  return (
    <div className={`p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all duration-200`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${scheme.bg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          {value}
        </div>

        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${
            trend >= 0 ? 'text-emerald-500' : 'text-rose-500'
          }`}>
            {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      {(trendLabel || subtitle) && (
        <div className="mt-2 text-xs text-[var(--text-secondary)] flex items-center justify-between">
          <span>{subtitle || trendLabel}</span>
        </div>
      )}
    </div>
  );
}
