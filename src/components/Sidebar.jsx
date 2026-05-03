import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, Globe, MapPin,
  FileBarChart2, Settings, LogOut, ChevronLeft, Building2
} from 'lucide-react'
import { logout } from '../api/authApi'
import clsx from 'clsx'

const NAV = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'لوحة التحكم' },
  { to: '/projects',   icon: FolderKanban,    label: 'المشاريع' },
  { to: '/sectors',    icon: Globe,           label: 'القطاعات' },
  { to: '/funding',    icon: FileBarChart2,   label: 'مصادر التمويل' },
  { to: '/map',        icon: MapPin,          label: 'خريطة GIS' },
  { to: '/reports',    icon: FileBarChart2,   label: 'التقارير' },
  { to: '/settings',   icon: Settings,        label: 'الإعدادات' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('auth_user') || '{}')

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="fixed top-0 right-0 h-screen w-64 flex flex-col z-40"
      style={{ background: 'linear-gradient(175deg, #0D1B2E 0%, #1E3A5F 100%)' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
          <Building2 className="text-white" size={22} />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">منصة إدارة</p>
          <p className="text-blue-200 text-xs">المشاريع الوطنية</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx('sidebar-link', isActive && 'active')
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-400/30 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.[0] || 'م'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name || 'المستخدم'}</p>
            <p className="text-blue-300 text-[10px] truncate">
              {user?.role === 'admin' ? 'مدير' : user?.role === 'official' ? 'مسؤول' : 'مشاهد'}
            </p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="sidebar-link w-full text-red-300 hover:bg-red-500/20 hover:text-red-200">
          <LogOut size={16} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  )
}
