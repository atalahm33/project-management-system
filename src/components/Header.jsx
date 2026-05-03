import { Bell, Search, ChevronLeft } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/dashboard': { title: 'لوحة التحكم الرئيسية', sub: 'نظرة عامة على المشاريع الوطنية' },
  '/projects':  { title: 'المشاريع',               sub: 'قائمة جميع المشاريع' },
  '/sectors':   { title: 'القطاعات',               sub: 'إدارة وتصنيف القطاعات' },
  '/funding':   { title: 'مصادر التمويل',          sub: 'تتبع مصادر تمويل المشاريع' },
  '/map':       { title: 'خريطة المشاريع الجغرافية', sub: 'توزيع المشاريع على الخريطة' },
  '/reports':   { title: 'التقارير',               sub: 'التقارير والتحليلات' },
  '/settings':  { title: 'الإعدادات',              sub: 'إعدادات النظام والحساب' },
}

export default function Header() {
  const { pathname } = useLocation()
  const base = '/' + pathname.split('/')[1]
  const info = PAGE_TITLES[base] || { title: 'منصة المشاريع', sub: '' }

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100
                       flex items-center justify-between px-6 py-3.5 gap-4">
      <div>
        <h1 className="text-lg font-bold text-gray-800 leading-tight">{info.title}</h1>
        {info.sub && <p className="text-xs text-gray-400 mt-0.5">{info.sub}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="بحث..."
            className="input pr-9 w-52 text-sm py-2"
          />
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100
                           flex items-center justify-center transition-colors">
          <Bell size={18} className="text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
        </button>

        {/* Date */}
        <div className="hidden lg:block text-left">
          <p className="text-xs font-semibold text-gray-700">
            {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </header>
  )
}
