import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, MapPin, Building2, X, RefreshCw, Clock, ShieldCheck } from 'lucide-react'
import { fetchProjects, fetchMyPendingProjects } from '../api/projectsApi'
import { fetchSectors } from '../api/sectorsApi'
import { fetchCompanies } from '../api/companiesApi'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'

const STATUS_OPTS = [
  { value: '', label: 'جميع الحالات' },
  { value: 'مخطط له', label: 'مخطط له' },
  { value: 'قيد التنفيذ', label: 'قيد التنفيذ' },
  { value: 'مكتمل', label: 'مكتمل' },
  { value: 'متأخر', label: 'متأخر' },
  { value: 'متوقف', label: 'متوقف' },
]

const fmt = n => {
  if (!n) return '0'
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} مليار`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} مليون`
  return n.toLocaleString('ar')
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [pendingProjects, setPendingProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [sectors, setSectors] = useState([])
  const [companies, setCompanies] = useState([])
  const [filters, setFilters] = useState({ 
    search: '', 
    sectorId: '', 
    companyId: '', 
    status: ''
  })
  const [page, setPage] = useState(1)
  const PER_PAGE = 8

  // تحميل البيانات الأولية بدون فلتر البحث (لأن البحث هيتم محلياً)
  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [projRes, sectRes, compRes] = await Promise.all([
        fetchProjects({}),
        fetchSectors(),
        fetchCompanies()
      ])
      // Only show approved projects in the main list
      const approved = (projRes || []).filter(p => p.approvalStatus === 'approved')
      setProjects(approved)
      setSectors(sectRes || [])
      setCompanies(compRes || [])

      // Load my own pending projects for the badge
      try {
        const myPending = await fetchMyPendingProjects()
        setPendingProjects(myPending || [])
      } catch {
        // ignore if endpoint unavailable
      }
    } catch (error) {
      console.error("Failed to load data", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  // فلترة المشاريع حسب كل الفلاتر (بما فيها البحث)
  const filteredProjects = useMemo(() => {
    let result = [...projects]
    
    // البحث في اسم المشروع والوصف
    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.toLowerCase().trim()
      result = result.filter(p => 
        p.title?.toLowerCase().includes(searchTerm) ||
        p.title_en?.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm) ||
        p.projectLocation?.toLowerCase().includes(searchTerm)
      )
    }
    
    // فلتر القطاع
    if (filters.sectorId) {
      result = result.filter(p => p.sectorId?._id === filters.sectorId || p.sectorId === filters.sectorId)
    }
    
    // فلتر الشركة
    if (filters.companyId) {
      result = result.filter(p => p.companyId?._id === filters.companyId || p.companyId === filters.companyId)
    }
    
    // فلتر الحالة
    if (filters.status) {
      result = result.filter(p => p.status === filters.status)
    }
    
    return result
  }, [projects, filters.search, filters.sectorId, filters.companyId, filters.status])

  const paginated = filteredProjects.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(filteredProjects.length / PER_PAGE)

  const handleReset = () => {
    setFilters({ search: '', sectorId: '', companyId: '', status: '' })
    setPage(1)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const removeFilter = (key) => {
    handleFilterChange(key, '')
  }

  // حساب عدد الفلاتر النشطة
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.search && filters.search.trim() !== '') count++
    if (filters.sectorId) count++
    if (filters.companyId) count++
    if (filters.status) count++
    return count
  }, [filters])

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">إدارة المشروعات القومية</h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredProjects.length} مشروع معتمد
              {activeFiltersCount > 0 && ` (تم تصفية ${activeFiltersCount} فلتر)`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Pending Projects Badge */}
            {pendingProjects.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => navigate(`/review-project/${pendingProjects[0]._id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all text-sm font-bold"
                >
                  <Clock size={15} className="text-amber-500" />
                  قيد المراجعة
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                    {pendingProjects.length}
                  </span>
                </button>
              </div>
            )}
            <button 
              onClick={loadInitialData}
              className="btn-ghost px-4 py-2 text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-all flex items-center gap-2"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              تحديث
            </button>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Field - بحث باسم المشروع */}
          <div className="relative flex-1">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="بحث باسم المشروع..."
              className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
            />
            {filters.search && (
              <button
                onClick={() => removeFilter('search')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select 
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm bg-white lg:w-48"
            value={filters.status}
            onChange={e => handleFilterChange('status', e.target.value)}
          >
            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Sector Filter */}
          <select 
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm bg-white lg:w-56"
            value={filters.sectorId}
            onChange={e => handleFilterChange('sectorId', e.target.value)}
          >
            <option value="">جميع القطاعات</option>
            {sectors.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>

          {/* Company Filter */}
          <select 
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm bg-white lg:w-56"
            value={filters.companyId}
            onChange={e => handleFilterChange('companyId', e.target.value)}
          >
            <option value="">جميع الشركات</option>
            {companies.map(c => <option key={c._id} value={c._id}>{c.name_ar || c.name}</option>)}
          </select>
        </div>

        {/* Active Filters Tags */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Filter size={12} />
              الفلاتر النشطة:
            </span>
            
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs">
                بحث: {filters.search}
                <button onClick={() => removeFilter('search')} className="hover:text-blue-900">
                  <X size={12} />
                </button>
              </span>
            )}
            
            {filters.status && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs">
                الحالة: {STATUS_OPTS.find(o => o.value === filters.status)?.label}
                <button onClick={() => removeFilter('status')} className="hover:text-green-900">
                  <X size={12} />
                </button>
              </span>
            )}
            
            {filters.sectorId && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs">
                القطاع: {sectors.find(s => s._id === filters.sectorId)?.name}
                <button onClick={() => removeFilter('sectorId')} className="hover:text-purple-900">
                  <X size={12} />
                </button>
              </span>
            )}
            
            {filters.companyId && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs">
                الشركة: {companies.find(c => c._id === filters.companyId)?.name_ar || companies.find(c => c._id === filters.companyId)?.name}
                <button onClick={() => removeFilter('companyId')} className="hover:text-orange-900">
                  <X size={12} />
                </button>
              </span>
            )}
            
            <button 
              onClick={handleReset}
              className="mr-auto text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <X size={12} />
              إعادة تعيين الكل
            </button>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          عرض {paginated.length > 0 ? (page-1)*PER_PAGE+1 : 0} إلى {Math.min(page*PER_PAGE, filteredProjects.length)} من {filteredProjects.length} مشروع
        </p>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            جاري التحميل...
          </div>
        )}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
            <p className="text-gray-400 text-sm">جاري تحميل المشاريع...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">#</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">اسم المشروع</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">القطاع والشركة</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">الحالة</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">الميزانية</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">الموقع</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.length > 0 ? paginated.map((p, idx) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-400">{(page-1)*PER_PAGE + idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <p className="font-bold text-gray-800 mb-1 text-sm">{p.title}</p>
                        {p.description && (
                          <p className="text-[11px] text-gray-400 truncate">{p.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {p.sectorId?.name && (
                          <span className="badge badge-info text-[10px] w-fit px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {p.sectorId.name}
                          </span>
                        )}
                        {p.companyId?.name_ar && (
                          <span className="flex items-center gap-1 text-[10px] text-gray-500">
                            <Building2 size={10} /> {p.companyId.name_ar || p.companyId.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 font-bold text-blue-900 text-sm">{fmt(p.totalBudget)}</td>
                    <td className="px-4 py-3">
                      {(p.projectLocation || p.location?.coordinates) && (
                        <div className="flex items-center gap-1 text-[11px] text-gray-500">
                          <MapPin size={10} className="text-primary" />
                          {p.projectLocation || (p.location?.coordinates ? p.location.coordinates.join(', ') : '')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => navigate(`/projects/${p._id}`)}
                          className="px-3 py-1.5 text-xs font-bold text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-all"
                        >
                          عرض التفاصيل
                        </button>
                        {/* Show review button for own pending projects */}
                        {p.approvalStatus === 'pending' && (
                          <button
                            onClick={() => navigate(`/review-project/${p._id}`)}
                            className="px-3 py-1.5 text-xs font-bold text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-50 transition-all flex items-center gap-1"
                          >
                            <Clock size={12} />
                            مراجعة
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Search size={40} className="text-gray-300" />
                        <p className="text-gray-400">لا توجد نتائج مطابقة للبحث</p>
                        {activeFiltersCount > 0 && (
                          <button 
                            onClick={handleReset}
                            className="text-primary text-sm hover:underline"
                          >
                            إعادة تعيين الفلاتر
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 bg-gray-50 border-t border-gray-200">
            <span className="text-xs text-gray-500 order-2 sm:order-1">
              صفحة {page} من {totalPages}
            </span>
            <div className="flex items-center gap-1.5 order-1 sm:order-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
              >
                السابق
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                        page === pageNum 
                          ? 'bg-primary text-white shadow-md' 
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}