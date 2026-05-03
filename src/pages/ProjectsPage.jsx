import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Plus, Eye, MapPin } from 'lucide-react'
import { fetchProjects } from '../api/projectsApi'
import { SECTORS } from '../data/mockData'
import StatusBadge from '../components/StatusBadge'
import ProgressBar from '../components/ProgressBar'

const STATUS_OPTS = [
  { value: '', label: 'جميع الحالات' },
  { value: 'in_progress', label: 'جارٍ' },
  { value: 'completed',   label: 'منجز' },
  { value: 'delayed',     label: 'متأخر' },
]

const fmt = n => (n / 1000).toFixed(2) + ' مليار'

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ sector: '', status: '', search: '' })
  const [page, setPage] = useState(1)
  const PER_PAGE = 6

  const load = async () => {
    setLoading(true)
    const { data } = await fetchProjects(filters)
    setProjects(data)
    setPage(1)
    setLoading(false)
  }

  useEffect(() => { load() }, [filters])

  const paginated = projects.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(projects.length / PER_PAGE)

  return (
    <div className="section-gap">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">قائمة المشاريع</h2>
          <p className="page-subtitle">{projects.length} مشروع في قاعدة البيانات</p>
        </div>
        <button className="btn-primary">
          <Plus size={16} /> إضافة مشروع
        </button>
      </div>

      {/* Filters */}
      <div className="card flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="بحث باسم المشروع أو الرقم..."
            className="input pr-9"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>
        <select className="select md:w-44"
          value={filters.sector}
          onChange={e => setFilters(f => ({ ...f, sector: e.target.value }))}>
          <option value="">كل القطاعات</option>
          {SECTORS.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
        <select className="select md:w-40"
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={() => setFilters({ sector: '', status: '', search: '' })}
          className="btn-ghost text-gray-400 hover:text-gray-600">
          <Filter size={16} /> إعادة تعيين
        </button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>الرقم</th>
                  <th>اسم المشروع</th>
                  <th>القطاع</th>
                  <th>الحالة</th>
                  <th>الميزانية</th>
                  <th>المصروف</th>
                  <th>التقدم</th>
                  <th>المحافظة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(p => (
                  <tr key={p.id}>
                    <td className="font-mono text-xs text-gray-500">{p.id}</td>
                    <td>
                      <p className="font-semibold text-gray-800 max-w-xs truncate">{p.name}</p>
                    </td>
                    <td>
                      <span className="badge badge-info text-xs">{p.sector}</span>
                    </td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="font-semibold text-gray-700">{fmt(p.budget)}</td>
                    <td className="text-gray-600">{fmt(p.spent)}</td>
                    <td className="w-32">
                      <ProgressBar value={p.progress} showLabel />
                    </td>
                    <td className="text-sm">
                      <span className="flex items-center gap-1 text-gray-500">
                        <MapPin size={12} />{p.governorate}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => navigate(`/projects/${p.id}`)}
                        className="btn-ghost text-primary px-2 py-1.5 text-xs">
                        <Eye size={14} /> عرض
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              عرض {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, projects.length)} من {projects.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="btn-ghost px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed text-xs">
                السابق
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
                    ${page === i+1 ? 'bg-primary text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                  {i + 1}
                </button>
              ))}
              <button disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="btn-ghost px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed text-xs">
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
