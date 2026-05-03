import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { fetchFundingSources } from '../api/financeApi'
import ProgressBar from '../components/ProgressBar'

const COLORS = ['#1E3A5F','#2D6A4F','#B5460F','#5A189A','#0077B6']
const fmt = n => (n / 1000).toFixed(1) + ' مليار'

export default function FundingPage() {
  const [sources, setSources] = useState([])
  useEffect(() => { fetchFundingSources().then(r => setSources(r.data)) }, [])

  const total = sources.reduce((a, s) => a + s.total, 0)
  const spent = sources.reduce((a, s) => a + s.spent, 0)

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h2 className="page-title">مصادر التمويل</h2>
          <p className="page-subtitle">تتبع وتحليل مصادر تمويل المشاريع الوطنية</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { l: 'إجمالي التمويل', v: fmt(total), color: 'text-primary' },
          { l: 'إجمالي المصروف', v: fmt(spent), color: 'text-warning' },
          { l: 'الميزانية المتبقية', v: fmt(total - spent), color: 'text-success' },
        ].map(({ l, v, color }) => (
          <div key={l} className="card text-center">
            <p className="text-sm text-gray-500 mb-1">{l}</p>
            <p className={`text-2xl font-bold ${color}`}>{v}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-bold text-gray-700 mb-4">توزيع مصادر التمويل</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={sources} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                {sources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [fmt(v)]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-bold text-gray-700 mb-4">الممول مقابل المصروف (مليار ر.س)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sources}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'Cairo' }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => (v/1000).toFixed(0) + 'م'} />
              <Tooltip formatter={(v, n) => [fmt(v), n === 'total' ? 'الإجمالي' : 'المصروف']} />
              <Legend formatter={v => v === 'total' ? 'الإجمالي' : 'المصروف'} />
              <Bar dataKey="total" name="total" fill="#1E3A5F" radius={[4,4,0,0]} />
              <Bar dataKey="spent" name="spent" fill="#F39C12" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <h3 className="font-bold text-gray-700 p-5 border-b">تفاصيل مصادر التمويل</h3>
        <table className="data-table">
          <thead><tr>
            <th>المصدر</th><th>النوع</th><th>الإجمالي</th><th>المصروف</th><th>المتبقي</th><th>نسبة الصرف</th>
          </tr></thead>
          <tbody>
            {sources.map((s, i) => {
              const pct = Math.round((s.spent / s.total) * 100)
              return (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="font-semibold text-gray-800">{s.name}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-info">{s.type}</span></td>
                  <td className="font-semibold">{fmt(s.total)}</td>
                  <td className="text-warning font-medium">{fmt(s.spent)}</td>
                  <td className="text-success font-medium">{fmt(s.total - s.spent)}</td>
                  <td className="w-40">
                    <ProgressBar value={pct} color={COLORS[i % COLORS.length]} showLabel />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
