import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, Wallet, TrendingUp, Building2, LayoutGrid, Info } from 'lucide-react'
import { fetchDashboardStats } from '../api/financeApi'
import ProgressBar from '../components/ProgressBar'

const COLORS = ['#1E3A5F','#2D6A4F','#B5460F','#5A189A','#0077B6','#C77DFF','#386641','#F39C12']

const fmt = n => {
  if (!n) return '0'
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} مليار`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} مليون`
  return n.toLocaleString('ar')
}

export default function SectorsPage() {
  const navigate = useNavigate()
  const [sectorData, setSectorData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { 
    fetchDashboardStats()
      .then(r => {
        setSectorData(r?.sectorDistribution || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h2 className="page-title">توزيع القطاعات الإستراتيجية</h2>
          <p className="page-subtitle">تحليل أداء المشروعات وتوزيع الميزانيات حسب القطاع</p>
        </div>
        <div className="flex gap-2">
            <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 flex items-center gap-3">
                <LayoutGrid size={18} className="text-primary" />
                <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">إجمالي القطاعات</p>
                    <p className="text-sm font-bold">{sectorData.length}</p>
                </div>
            </div>
        </div>
      </div>

      {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
            <p className="text-gray-400 text-sm">جاري تحليل البيانات...</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
          {sectorData.map((s, i) => {
            const progress = s.totalBudget > 0 ? Math.round((s.totalSpent / s.totalBudget) * 100) : 0
            return (
              <div key={s._id}
                className="card hover:shadow-navy-lg transition-all duration-300 animate-fade-in-up cursor-pointer group border-gray-100"
                style={{ animationDelay: `${i * 80}ms` }}
                onClick={() => navigate(`/projects?sectorId=${s._id}`)}>
                
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner"
                            style={{ background: COLORS[i % COLORS.length] + '15', color: COLORS[i % COLORS.length] }}>
                            {s.sectorName.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 group-hover:text-primary transition-colors text-sm">{s.sectorName}</h3>
                            <p className="text-[10px] text-gray-400 font-mono">CODE: {s._id.slice(-6).toUpperCase()}</p>
                        </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                        <Info size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                        <FolderKanban size={14} />
                        <span className="text-[10px] font-bold uppercase">المشروعات</span>
                    </div>
                    <p className="text-xl font-black text-gray-800">{s.count}</p>
                  </div>
                  <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                        <Wallet size={14} />
                        <span className="text-[10px] font-bold uppercase">الميزانية</span>
                    </div>
                    <p className="text-sm font-black text-blue-900">{fmt(s.totalBudget)}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-gray-50">
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-500">
                    <span className="flex items-center gap-1"><TrendingUp size={12} /> نسبة المنصرف الفعلي</span>
                    <span className="text-gray-800">{progress}%</span>
                  </div>
                  <ProgressBar value={progress} color={COLORS[i % COLORS.length]} size="md" />
                  <div className="flex justify-between text-[10px] text-gray-400">
                      <span>المنصرف: {fmt(s.totalSpent)}</span>
                      <span>المتبقي: {fmt(s.totalBudget - s.totalSpent)}</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <div className="flex -space-x-2 space-x-reverse">
                        {[1,2,3].map(item => (
                            <div key={item} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500">
                                <Building2 size={10} />
                            </div>
                        ))}
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-primary text-white flex items-center justify-center text-[8px] font-bold">
                            +
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        عرض كافة المشروعات ←
                    </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
