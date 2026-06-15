import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { fetchFundingStats } from '../api/financeApi'
import ProgressBar from '../components/ProgressBar'

const COLORS = ['#1E3A5F','#2D6A4F','#B5460F','#5A189A','#0077B6', '#C77DFF', '#386641', '#F39C12']
const fmt = n => {
  if (!n) return '0'
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' مليار'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + ' مليون'
  return n.toLocaleString('ar')
}

export default function FundingSourcesPage() {
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFundingStats()
      .then(r => {
        setSources(r?.fundingStats || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  )

  const totalCommitted = sources.reduce((a, s) => a + (s.totalCommitted || 0), 0)
  const totalReceived = sources.reduce((a, s) => a + (s.totalReceived || 0), 0)
  const totalRemaining = totalCommitted - totalReceived

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h2 className="page-title">مصادر التمويل وإحصائياتها</h2>
          <p className="page-subtitle">تتبع وتحليل مصادر تمويل المشروعات الوطنية بالتفصيل</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { l: 'إجمالي التمويل المعتمد', v: fmt(totalCommitted), color: 'text-primary' },
          { l: 'إجمالي التمويل المستلم', v: fmt(totalReceived), color: 'text-warning' },
          { l: 'إجمالي المتبقي', v: fmt(totalRemaining), color: 'text-success' },
        ].map(({ l, v, color }) => (
          <div key={l} className="card text-center">
            <p className="text-sm text-gray-500 mb-1">{l}</p>
            <p className={`text-2xl font-bold ${color}`}>{v}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-bold text-gray-700 mb-4">توزيع التمويل حسب المصدر</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={sources} dataKey="totalCommitted" nameKey="sourceName" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                {sources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [fmt(v)]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-bold text-gray-700 mb-4">الممول مقابل المستلم</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sources}>
              <XAxis dataKey="sourceName" tick={{ fontSize: 10, fontFamily: 'Cairo' }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
              <Tooltip formatter={(v, n) => [fmt(v), n === 'totalCommitted' ? 'المعتمد' : 'المستلم']} />
              <Legend formatter={v => v === 'totalCommitted' ? 'المعتمد' : 'المستلم'} />
              <Bar dataKey="totalCommitted" name="totalCommitted" fill="#1E3A5F" radius={[4,4,0,0]} />
              <Bar dataKey="totalReceived" name="totalReceived" fill="#F39C12" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <h3 className="font-bold text-gray-700 p-5 border-b">تفاصيل مصادر التمويل</h3>
        <table className="data-table">
          <thead><tr>
            <th>المصدر</th><th>عدد المشروعات الممولة</th><th>إجمالي المعتمد</th><th>المستلم</th><th>المتبقي</th><th>نسبة الاستلام</th>
          </tr></thead>
          <tbody>
            {sources.map((s, i) => {
              const pct = s.totalCommitted > 0 ? Math.round((s.totalReceived / s.totalCommitted) * 100) : 0
              return (
                <tr key={s.sourceName}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="font-semibold text-gray-800">{s.sourceName}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-info">{s.projectsCount} مشروعات</span></td>
                  <td className="font-semibold">{fmt(s.totalCommitted)}</td>
                  <td className="text-warning font-medium">{fmt(s.totalReceived)}</td>
                  <td className="text-success font-medium">{fmt(s.totalRemaining)}</td>
                  <td className="w-40">
                    <ProgressBar value={pct} color={COLORS[i % COLORS.length]} showLabel />
                  </td>
                </tr>
              )
            })}
            {sources.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">لا توجد مصادر تمويل مضافة للمشروعات</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
