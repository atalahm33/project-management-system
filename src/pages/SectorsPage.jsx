import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, Wallet } from 'lucide-react'
import { fetchSectors } from '../api/sectorsApi'
import ProgressBar from '../components/ProgressBar'

const COLORS = ['#1E3A5F','#2D6A4F','#B5460F','#5A189A','#0077B6','#C77DFF','#386641','#F39C12']

export default function SectorsPage() {
  const navigate = useNavigate()
  const [sectors, setSectors] = useState([])

  useEffect(() => { fetchSectors().then(r => setSectors(r.data)) }, [])

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h2 className="page-title">القطاعات</h2>
          <p className="page-subtitle">{sectors.length} قطاع في المنظومة</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 stagger">
        {sectors.map((s, i) => (
          <div key={s.id}
            className="card hover:shadow-navy-lg transition-all duration-300 animate-fade-in-up cursor-pointer group"
            style={{ animationDelay: `${i * 60}ms` }}
            onClick={() => navigate(`/projects`)}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: COLORS[i % COLORS.length] + '18' }}>
                {s.icon}
              </div>
              <h3 className="font-bold text-gray-800 group-hover:text-primary transition-colors">{s.name}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                <FolderKanban size={14} className="mx-auto mb-1" style={{ color: COLORS[i % COLORS.length] }} />
                <p className="text-lg font-bold text-gray-800">{s.projectsCount}</p>
                <p className="text-xs text-gray-500">مشروع</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                <Wallet size={14} className="mx-auto mb-1" style={{ color: COLORS[i % COLORS.length] }} />
                <p className="text-sm font-bold text-gray-800">{(s.budget / 1000).toFixed(1)}م</p>
                <p className="text-xs text-gray-500">ر.س</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>متوسط التقدم</span>
                <span className="font-semibold">{s.avgProgress}%</span>
              </div>
              <ProgressBar value={s.avgProgress} color={COLORS[i % COLORS.length]} />
            </div>
            <button className="mt-4 w-full text-xs font-semibold text-center py-2 rounded-lg border transition-all"
              style={{ borderColor: COLORS[i % COLORS.length] + '40', color: COLORS[i % COLORS.length] }}>
              عرض المشاريع
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
