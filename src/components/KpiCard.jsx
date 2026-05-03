import clsx from 'clsx'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function KpiCard({ icon: Icon, label, value, sub, trend, trendUp, color = '#1E3A5F', delay = 0 }) {
  return (
    <div className="kpi-card animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between">
        <div className="kpi-card-icon" style={{ background: color + '18' }}>
          <Icon size={22} style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className={clsx(
            'inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full',
            trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          )}>
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800 leading-tight">{value}</p>
        <p className="text-sm font-medium text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}
