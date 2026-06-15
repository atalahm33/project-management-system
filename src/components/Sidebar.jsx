import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, Globe, FileBarChart2,
  Settings, LogOut, Building2, PlusCircle, CreditCard, FileSignature,
  Wallet, Banknote, TrendingUp
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import clsx from 'clsx'

const ROLE_TRANSLATIONS = {
  'Super Admin': 'مدير عام',
  'Admin': 'مدير نظام',
  'Reviewer': 'مراجع',
  'Engineering Manager': 'مدير هندسي',
  'Financial Manager': 'مدير مالي',
  'Viewer': 'مشاهد'
}

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { to: '/projects', icon: FolderKanban, label: 'المشروعات' },
  { to: '/sectors', icon: Globe, label: 'القطاعات' },
  { to: '/funding-sources', icon: FileBarChart2, label: 'مصادر التمويل' },
  { to: '/submissions', icon: FileSignature, label: 'الاعتمادات' },
]

const ADD_ACTIONS_NAV = [
  { to: '/add-project', icon: PlusCircle, label: 'إضافة مشروع', roles: ['Admin', 'Reviewer'] }, // Reviewer can add project
  { to: '/add-progress', icon: TrendingUp, label: 'تحديث نسبة الإنجاز', roles: ['Admin', 'Engineering Manager'] },
  { to: '/add-expense', icon: CreditCard, label: 'إضافة مصروف', roles: ['Admin', 'Financial Manager'] },
  { to: '/add-contract', icon: FileSignature, label: 'إضافة عقد', roles: ['Admin', 'Financial Manager'] },
  { to: '/add-funding', icon: Wallet, label: 'إضافة مصدر تمويل', roles: ['Admin', 'Financial Manager'] },
  { to: '/add-transaction', icon: Banknote, label: 'إضافة دفعة من مصدر التمويل', roles: ['Admin', 'Financial Manager'] },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { user, isAdmin, logout } = useAuth()

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
          <img src="/images/NSPO-Logo.png" alt="" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight font-arabic">منصة إدارة</p>
          <p className="text-blue-200 text-xs font-arabic">المشروعات </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-[10px] font-bold text-blue-400/60 uppercase tracking-widest mb-2">القائمة الرئيسية</p>
        {NAV.filter(item => !(item.to === '/submissions' && user?.role?.toLowerCase() === 'viewer')).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx('sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all hover:bg-white/10 text-blue-100/70', isActive && 'bg-white/10 text-white font-bold border-r-4 border-primary')
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            <span className="font-arabic">{label}</span>
          </NavLink>
        ))}

        {user?.role && ADD_ACTIONS_NAV.some(nav => nav.roles.includes(user?.role)) && (
          <>
            <p className="px-4 text-[10px] font-bold text-blue-400/60 uppercase tracking-widest mt-8 mb-2 font-arabic">إدارة النظام وإدخال البيانات</p>
            {ADD_ACTIONS_NAV.filter(nav => nav.roles.includes(user?.role)).map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx('sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all hover:bg-white/10 text-blue-100/70', isActive && 'bg-white/10 text-white font-bold border-r-4 border-primary')
                }
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="font-arabic">{label}</span>
              </NavLink>
            ))}
          </>
        )}

        <p className="px-4 text-[10px] font-bold text-blue-400/60 uppercase tracking-widest mt-8 mb-2 font-arabic">أخرى</p>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            clsx('sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all hover:bg-white/10 text-blue-100/70', isActive && 'bg-white/10 text-white font-bold border-r-4 border-primary')
          }
        >
          <Settings size={18} className="flex-shrink-0" />
          <span className="font-arabic">الإعدادات</span>
        </NavLink>
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/10 bg-black/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-lg">
            {user?.name?.[0] || 'م'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-bold truncate font-arabic">{user?.name || 'المستخدم'}</p>
            <p className="text-blue-300 text-[10px] truncate font-arabic">
              {ROLE_TRANSLATIONS[user?.role] || user?.role || 'مستخدم'}
            </p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 w-full text-red-300 hover:bg-red-500/20 hover:text-red-200 rounded-xl transition-all text-xs font-bold font-arabic mt-2">
          <LogOut size={16} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  )
}
