import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import { PROJECTS, SECTORS, STATUS_COLORS } from '../data/mockData'
import StatusBadge from '../components/StatusBadge'
import ProgressBar from '../components/ProgressBar'
import { useNavigate } from 'react-router-dom'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const STATUS_MARKER_COLORS = {
  completed: '#2ECC71',
  in_progress: '#F39C12',
  delayed: '#E74C3C',
}

export default function MapPage() {
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSector, setFilterSector] = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = PROJECTS.filter(p =>
    (!filterStatus || p.status === filterStatus) &&
    (!filterSector || p.sector === filterSector)
  )

  const counts = {
    completed: PROJECTS.filter(p => p.status === 'completed').length,
    in_progress: PROJECTS.filter(p => p.status === 'in_progress').length,
    delayed: PROJECTS.filter(p => p.status === 'delayed').length,
  }

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h2 className="page-title">خريطة المشاريع الجغرافية</h2>
          <p className="page-subtitle">عرض توزيع المشاريع على الخريطة التفاعلية</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'منجز', count: counts.completed, color: 'bg-green-100 text-green-700', dot: '#2ECC71' },
          { label: 'جارٍ',  count: counts.in_progress, color: 'bg-yellow-100 text-yellow-700', dot: '#F39C12' },
          { label: 'متأخر', count: counts.delayed,  color: 'bg-red-100 text-red-700', dot: '#E74C3C' },
        ].map(s => (
          <div key={s.label} className={`card flex items-center gap-3 ${s.color}`}>
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.dot }} />
            <div>
              <p className="text-xl font-bold">{s.count}</p>
              <p className="text-xs">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Map */}
      <div className="card p-3 flex flex-col md:flex-row gap-3 items-center">
        <select className="select md:w-44" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">كل الحالات</option>
          <option value="in_progress">جارٍ</option>
          <option value="completed">منجز</option>
          <option value="delayed">متأخر</option>
        </select>
        <select className="select md:w-44" value={filterSector} onChange={e => setFilterSector(e.target.value)}>
          <option value="">كل القطاعات</option>
          {SECTORS.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
        <span className="text-sm text-gray-500">{filtered.length} مشروع معروض</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="card p-2 lg:col-span-3" style={{ height: 500 }}>
          <MapContainer center={[23.8859, 45.0792]} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
            {filtered.map(p => (
              <CircleMarker
                key={p.id}
                center={[p.lat, p.lng]}
                radius={10}
                fillColor={STATUS_MARKER_COLORS[p.status]}
                color="#fff"
                weight={2}
                fillOpacity={0.85}
                eventHandlers={{ click: () => setSelected(p) }}
              >
                <Popup>
                  <div className="text-right" style={{ fontFamily: 'Cairo', minWidth: 180 }}>
                    <p className="font-bold text-sm text-gray-800 mb-1">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.sector} · {p.governorate}</p>
                    <div className="mt-2">
                      <ProgressBar value={p.progress} showLabel size="sm" />
                    </div>
                    <button onClick={() => navigate(`/projects/${p.id}`)}
                      className="mt-2 text-xs text-primary font-semibold hover:underline">
                      عرض التفاصيل
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Side list */}
        <div className="card p-0 overflow-hidden flex flex-col" style={{ maxHeight: 500 }}>
          <h3 className="font-bold text-gray-700 p-4 border-b text-sm">قائمة المشاريع</h3>
          <div className="overflow-y-auto flex-1">
            {filtered.map(p => (
              <button key={p.id} onClick={() => setSelected(p)}
                className={`w-full text-right px-4 py-3 border-b border-gray-50 hover:bg-blue-50 transition-colors
                  ${selected?.id === p.id ? 'bg-blue-50' : ''}`}>
                <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: STATUS_MARKER_COLORS[p.status] }} />
                  <span className="text-xs text-gray-400">{p.governorate}</span>
                  <span className="text-xs font-semibold text-gray-600 mr-auto">{p.progress}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
