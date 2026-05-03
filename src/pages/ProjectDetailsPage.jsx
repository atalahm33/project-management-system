import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowRight, Calendar, MapPin, Building2,
  DollarSign, TrendingUp, Loader2, CheckCircle2, Circle
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { fetchProjectById } from '../api/projectsApi'
import StatusBadge from '../components/StatusBadge'
import ProgressBar from '../components/ProgressBar'

const COLORS = ['#1E3A5F','#2D6A4F','#B5460F','#5A189A','#0077B6','#F39C12']
const fmt = n => (n / 1000).toFixed(2) + ' مليار'

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CircularProgress = ({ value, label, color }) => {
  const r = 40, c = 2 * Math.PI * r
  const stroke = c - (value / 100) * c
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#F4F7FA" strokeWidth="10" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={c} strokeDashoffset={stroke}
            style={{ transition: 'stroke-dashoffset 1s ease' }}
            strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-800">{value}%</span>
        </div>
      </div>
      <p className="text-xs font-semibold text-gray-600 text-center">{label}</p>
    </div>
  )
}

const TABS = ['نظرة عامة', 'المالية', 'التقدم', 'الموقع الجغرافي']

export default function ProjectDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)

  useEffect(() => {
    fetchProjectById(id).then(r => { setProject(r.data); setLoading(false) })
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  )
  if (!project) return <div className="text-center py-16 text-gray-500">المشروع غير موجود</div>

  return (
    <div className="section-gap">
      {/* Back + Header */}
      <div>
        <button onClick={() => navigate(-1)}
          className="btn-ghost text-gray-500 mb-4 -mr-1">
          <ArrowRight size={16} /> العودة للمشاريع
        </button>
        <div className="page-header flex-col md:flex-row items-start md:items-center gap-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-mono text-gray-400">{project.id}</span>
              <span className="badge badge-info">{project.sector}</span>
              <StatusBadge status={project.status} />
            </div>
            <h2 className="page-title">{project.name}</h2>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all
              ${tab === i ? 'bg-white text-primary shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab 0: Overview */}
      {tab === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card lg:col-span-2 space-y-4">
            <h3 className="font-bold text-gray-700 border-b pb-3">معلومات المشروع</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              {[
                { icon: Building2, l: 'المقاول الرئيسي', v: project.contractor },
                { icon: MapPin,    l: 'المحافظة',        v: project.governorate },
                { icon: Calendar,  l: 'تاريخ البدء',      v: project.startDate },
                { icon: Calendar,  l: 'تاريخ الانتهاء',   v: project.endDate },
              ].map(({ icon: Icon, l, v }) => (
                <div key={l} className="flex items-start gap-2">
                  <Icon size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400 text-xs">{l}</p>
                    <p className="font-semibold text-gray-700">{v}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed border-t pt-3">{project.description}</p>
          </div>

          <div className="card space-y-3">
            <h3 className="font-bold text-gray-700 border-b pb-3">نسبة الإنجاز الكلية</h3>
            <div className="flex justify-center py-4">
              <CircularProgress value={project.physicalProgress} label="التقدم الكلي" color="#1E3A5F" />
            </div>
            <ProgressBar value={project.physicalProgress} size="lg" showLabel />
          </div>
        </div>
      )}

      {/* Tab 1: Financial */}
      {tab === 1 && (
        <div className="section-gap">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { l: 'إجمالي الميزانية', v: fmt(project.budget), color: 'text-primary' },
              { l: 'المصروف حتى الآن', v: fmt(project.spent),  color: 'text-warning' },
              { l: 'الميزانية المتبقية', v: fmt(project.budget - project.spent), color: 'text-success' },
            ].map(({ l, v, color }) => (
              <div key={l} className="card text-center">
                <p className="text-gray-500 text-sm mb-1">{l}</p>
                <p className={`text-2xl font-bold ${color}`}>{v}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-bold text-gray-700 mb-4">توزيع الميزانية</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={project.budgetBreakdown} dataKey="value" nameKey="name"
                       cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                    {project.budgetBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v.toLocaleString('ar') + ' مليون']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-0 overflow-hidden">
              <h3 className="font-bold text-gray-700 p-4 border-b">سجل المصروفات</h3>
              <table className="data-table">
                <thead><tr>
                  <th>الفئة</th><th>المبلغ (م.ر.س)</th><th>التاريخ</th><th>المورد</th>
                </tr></thead>
                <tbody>
                  {project.expenses.map(e => (
                    <tr key={e.id}>
                      <td><span className="badge badge-info">{e.category}</span></td>
                      <td className="font-semibold">{e.amount.toLocaleString('ar')}</td>
                      <td className="text-gray-500 text-xs">{e.date}</td>
                      <td className="text-xs">{e.vendor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Progress */}
      {tab === 2 && (
        <div className="section-gap">
          <div className="card">
            <h3 className="font-bold text-gray-700 mb-6">مؤشرات التقدم</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <CircularProgress value={project.physicalProgress}   label="التقدم المادي"   color="#1E3A5F" />
              <CircularProgress value={project.financialProgress}  label="التقدم المالي"   color="#F39C12" />
              <CircularProgress value={project.timeProgress}       label="التقدم الزمني"   color="#5A189A" />
              <CircularProgress value={Math.round((project.physicalProgress + project.financialProgress + project.timeProgress) / 3)}
                                label="التقدم الكلي المرجح" color="#2ECC71" />
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-gray-700 mb-4">المراحل والمعالم</h3>
            <div className="space-y-3">
              {project.milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-4">
                  {m.done
                    ? <CheckCircle2 size={20} className="text-success flex-shrink-0" />
                    : <Circle size={20} className="text-gray-300 flex-shrink-0" />}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${m.done ? 'text-gray-800' : 'text-gray-400'}`}>{m.name}</p>
                  </div>
                  <span className="text-xs text-gray-400">{m.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: GIS */}
      {tab === 3 && (
        <div className="section-gap">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {[
              { l: 'خط العرض', v: project.lat },
              { l: 'خط الطول', v: project.lng },
              { l: 'المحافظة', v: project.governorate },
            ].map(({ l, v }) => (
              <div key={l} className="card text-center">
                <p className="text-xs text-gray-400 mb-1">{l}</p>
                <p className="font-bold text-primary">{v}</p>
              </div>
            ))}
          </div>
          <div className="card p-2" style={{ height: 400 }}>
            <MapContainer center={[project.lat, project.lng]} zoom={10} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© OpenStreetMap' />
              <Marker position={[project.lat, project.lng]}>
                <Popup><b>{project.name}</b><br />{project.governorate}</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  )
}
