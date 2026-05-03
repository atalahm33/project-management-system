import { useEffect, useState } from 'react'
import {
  FolderKanban, CheckCircle2, Clock, AlertTriangle,
  Wallet, TrendingUp, PiggyBank, BarChart3
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import KpiCard from '../components/KpiCard'
import { fetchDashboardStats, fetchBudgetAnalytics } from '../api/financeApi'
import { SECTORS } from '../data/mockData'

const fmt = n => n >= 1000 ? `${(n / 1000).toFixed(1)} مليار` : `${n} مليون`
const COLORS = ['#1E3A5F','#2D6A4F','#B5460F','#5A189A','#0077B6','#C77DFF','#386641','#F39C12']

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    fetchDashboardStats().then(r => setStats(r.data))
    fetchBudgetAnalytics().then(r => setAnalytics(r.data))
  }, [])

  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  )

  const KPIS = [
    { icon: FolderKanban, label: 'إجمالي المشاريع',   value: stats.totalProjects,     color: '#1E3A5F', trend: '+8%',  trendUp: true },
    { icon: Clock,        label: 'المشاريع الجارية',   value: stats.ongoingProjects,   color: '#F39C12', trend: '+3%',  trendUp: true },
    { icon: CheckCircle2, label: 'المشاريع المنجزة',   value: stats.completedProjects, color: '#2ECC71', trend: '+12%', trendUp: true },
    { icon: AlertTriangle,label: 'المشاريع المتأخرة',  value: stats.delayedProjects,   color: '#E74C3C', trend: '-2%',  trendUp: false },
    { icon: Wallet,       label: 'إجمالي الميزانية',   value: fmt(stats.totalBudget),  color: '#1E3A5F' },
    { icon: TrendingUp,   label: 'إجمالي المصروف',     value: fmt(stats.totalSpent),   color: '#5A189A' },
    { icon: PiggyBank,    label: 'الميزانية المتبقية',  value: fmt(stats.remainingBudget), color: '#2D6A4F' },
    { icon: BarChart3,    label: 'نسبة الإنفاق',       value: `${stats.utilizationPct}%`, color: '#0077B6', trend: '+2%', trendUp: true },
  ]

  const statusData = [
    { name: 'منجز',  value: stats.completedProjects, color: '#2ECC71' },
    { name: 'جارٍ',  value: stats.ongoingProjects,   color: '#F39C12' },
    { name: 'متأخر', value: stats.delayedProjects,   color: '#E74C3C' },
  ]

  return (
    <div className="section-gap">
      {/* KPIs */}
      <div className="grid-kpi stagger">
        {KPIS.map((k, i) => (
          <KpiCard key={i} {...k} delay={i * 50} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sectors Pie */}
        <div className="card">
          <h3 className="font-bold text-gray-700 mb-4">المشاريع حسب القطاع</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={SECTORS} dataKey="projectsCount" nameKey="name"
                   cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                {SECTORS.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v + ' مشروع', n]} />
              <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Budget Bar */}
        <div className="card lg:col-span-2">
          <h3 className="font-bold text-gray-700 mb-4">الميزانية مقابل الإنفاق الشهري (مليون ر.س)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics?.monthly || []} barGap={4}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'Cairo' }} />
              <YAxis tick={{ fontSize: 11, fontFamily: 'Cairo' }} />
              <Tooltip formatter={(v, n) => [v.toLocaleString('ar') + ' مليون', n === 'budget' ? 'الميزانية' : 'المصروف']} />
              <Legend formatter={v => v === 'budget' ? 'الميزانية' : 'المصروف'} />
              <Bar dataKey="budget" name="budget" fill="#1E3A5F" radius={[4,4,0,0]} />
              <Bar dataKey="spent"  name="spent"  fill="#F39C12" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status donut + Sector budget bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card">
          <h3 className="font-bold text-gray-700 mb-4">توزيع حالات المشاريع</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name"
                   cx="50%" cy="50%" outerRadius={75} innerRadius={45}>
                {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="font-bold text-gray-700 mb-4">الميزانية حسب القطاع (مليون ر.س)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={SECTORS} layout="vertical" barSize={14}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fontFamily: 'Cairo' }} />
              <Tooltip formatter={(v) => [v.toLocaleString('ar') + ' مليون']} />
              <Bar dataKey="budget" fill="#1E3A5F" radius={[0,4,4,0]}>
                {SECTORS.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
