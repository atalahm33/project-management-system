import React, { useState } from 'react'
import { 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Settings as SettingsIcon,
  ShieldAlert,
  Fingerprint,
  Calendar,
  LockKeyhole,
  Activity
} from 'lucide-react'
import { registerUser, getCurrentUser } from '../api/authApi'

const ROLE_TRANSLATIONS = {
  'Super Admin': 'مدير عام',
  'Admin': 'مدير نظام',
  'Reviewer': 'مراجع',
  'Engineering Manager': 'مدير هندسي',
  'Financial Manager': 'مدير مالي',
  'Viewer': 'مشاهد'
}

const getRoleArabic = (role) => ROLE_TRANSLATIONS[role] || role

const getRoleBadgeStyle = (role) => {
  switch (role) {
    case 'Super Admin':
      return 'bg-purple-50 text-purple-600 border border-purple-200'
    case 'Admin':
      return 'bg-red-50 text-red-600 border border-red-200'
    case 'Reviewer':
      return 'bg-amber-50 text-amber-600 border border-amber-200'
    case 'Engineering Manager':
      return 'bg-blue-50 text-blue-600 border border-blue-200'
    case 'Financial Manager':
      return 'bg-emerald-50 text-emerald-600 border border-emerald-200'
    case 'Viewer':
    default:
      return 'bg-slate-50 text-slate-600 border border-slate-200'
  }
}

const Setting = () => {
  const currentUser = getCurrentUser()
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', message: '' })
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Viewer'
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setFeedback({ type: '', message: '' })

    try {
      await registerUser(formData)
      setFeedback({ 
        type: 'success', 
        message: 'تم إنشاء الحساب بنجاح! يمكن للمستخدم الآن تسجيل الدخول.' 
      })
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'Viewer'
      })
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'فشل في إنشاء الحساب. يرجى المحاولة مرة أخرى.'
      setFeedback({ 
        type: 'error', 
        message: errorMsg 
      })
    } finally {
      setLoading(false)
    }
  }

  // Only super admins and admins can see the user creation section
  const canCreateUser = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin'

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500" dir="rtl">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gradient-to-l from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl shadow-slate-100 border border-slate-700/30">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="p-4 bg-white/10 backdrop-blur-md text-blue-400 rounded-2xl border border-white/10 shadow-inner">
            <SettingsIcon size={36} className="animate-spin-slow text-blue-300" />
          </div>
          <div className="text-center md:text-right space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight font-arabic">إعدادات الحساب</h1>
            <p className="text-slate-300 text-sm font-arabic">إدارة الملف الشخصي والصلاحيات وإعدادات الأمان في المنصة</p>
          </div>
        </div>
      </div>

      {canCreateUser ? (
        /* GRID LAYOUT FOR ADMINS */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Right Column: User Creation */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-md">
              <div className="bg-slate-50 p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3 font-arabic">
                    <UserPlus className="text-blue-600" size={22} />
                    إنشاء حساب مستخدم جديد
                  </h2>
                  <p className="text-slate-500 text-xs mt-1 font-arabic">أضف مسؤولاً جديداً أو مشاهدًا للمنصة وصلاحياتهم</p>
                </div>
                <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100/50 self-start md:self-auto font-arabic">
                  صلاحيات مدير النظام نشطة
                </span>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {/* Feedback Message */}
                {feedback.message && (
                  <div className={`p-4 rounded-2xl flex items-center gap-3 border animate-in slide-in-from-top-2 font-arabic ${
                    feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'
                  }`}>
                    {feedback.type === 'success' ? (
                      <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle size={20} className="text-rose-600 flex-shrink-0" />
                    )}
                    <span className="font-semibold text-sm">{feedback.message}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-2 font-arabic">
                      <UserIcon size={14} className="text-slate-400" />
                      الاسم الكامل للموظف
                    </label>
                    <input
                      required
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="أدخل الاسم ثلاثي أو رباعي"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-2 font-arabic">
                      <Mail size={14} className="text-slate-400" />
                      البريد الإلكتروني المهني
                    </label>
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="example@nspo.gov.eg"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 text-left"
                      dir="ltr"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-2 font-arabic">
                      <Lock size={14} className="text-slate-400" />
                      كلمة مرور الحساب الجديد
                    </label>
                    <input
                      required
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-2 font-arabic">
                      <ShieldCheck size={14} className="text-slate-400" />
                      الصلاحيات (الدور الوظيفي)
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-white cursor-pointer"
                    >
                      <option value="Viewer">مشاهد</option>
                      <option value="Reviewer">مراجع</option>
                      <option value="Engineering Manager">مدير هندسي</option>
                      <option value="Financial Manager">مدير مالي</option>
                      <option value="Admin">مدير نظام</option>
                      <option value="Super Admin">مدير عام</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full md:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:transform-none shadow-lg shadow-blue-200/50 font-arabic"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    حفظ وإنشاء الحساب
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Left Column: My Account details */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-md space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xl font-extrabold shadow-lg shadow-blue-100">
                  {currentUser?.name?.[0] || 'م'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight font-arabic">{currentUser?.name || 'مستخدم المنصة'}</h3>
                  <span className="text-slate-400 text-xs font-arabic">الحساب الحالي نشط</span>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="space-y-5">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400 font-arabic">اسم المستخدم</span>
                  <span className="text-sm font-semibold text-slate-700 font-arabic">{currentUser?.name || 'مستخدم'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400 font-arabic">البريد الإلكتروني المهني</span>
                  <span className="text-sm font-semibold text-slate-700 text-left font-arabic" dir="ltr">{currentUser?.email}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400 font-arabic">الدور والصلاحيات</span>
                  <div className="mt-1">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold font-arabic ${getRoleBadgeStyle(currentUser?.role)}`}>
                      {getRoleArabic(currentUser?.role)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100/50 flex gap-4">
              <ShieldAlert className="text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" size={20} />
              <div className="space-y-1">
                <h4 className="text-amber-800 font-bold text-sm font-arabic">تنبيه حماية النظام</h4>
                <p className="text-xs text-amber-700 leading-relaxed font-arabic">
                  عمليات إنشاء حسابات المستخدمين الجديدة مقتصرة فقط على إدارة النظام. يرجى مراجعة الصلاحيات والبريد بدقة لمنع تداخل المسؤوليات.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* PREMIUM DASHBOARD PROFILE FOR NON-ADMINS (VIEWER, REVIEWER, ETC.) */
        /* NO "UNAUTHORIZED ACCESS" WARNING - JUST BEAUTIFUL PREMIUM CARD */
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl shadow-lg shadow-slate-100 border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Elegant Cover Gradient */}
            <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-800 relative">
              <div className="absolute -bottom-12 right-8">
                <div className="w-24 h-24 rounded-3xl bg-white p-1.5 shadow-xl">
                  <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-extrabold shadow-inner">
                    {currentUser?.name?.[0] || 'م'}
                  </div>
                </div>
              </div>
              <div className="absolute bottom-4 left-6 flex items-center gap-1.5 bg-black/25 backdrop-blur-md text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold border border-white/10 font-arabic">
                <Activity size={12} className="animate-pulse" />
                متصل حالياً
              </div>
            </div>

            {/* Profile Info */}
            <div className="pt-16 pb-8 px-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-800 font-arabic">{currentUser?.name || 'مستخدم المنصة'}</h2>
                  <p className="text-slate-400 text-xs mt-1 font-arabic">عضو نشط في جهاز مشروعات الخدمة الوطنية</p>
                </div>
                <div className="flex items-center gap-2 mt-1 md:mt-0">
                  <span className="text-xs text-slate-400 font-arabic">الدور الوظيفي:</span>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold font-arabic ${getRoleBadgeStyle(currentUser?.role)}`}>
                    {getRoleArabic(currentUser?.role)}
                  </span>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100/50 text-blue-600 rounded-xl">
                    <UserIcon size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-arabic">الاسم الكامل</span>
                    <span className="text-sm font-bold text-slate-700 font-arabic">{currentUser?.name || 'مستخدم'}</span>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100/50 text-indigo-600 rounded-xl">
                    <Mail size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-arabic">البريد الإلكتروني المهني</span>
                    <span className="text-sm font-bold text-slate-700 font-arabic" dir="ltr">{currentUser?.email}</span>
                  </div>
                </div>


               
              </div>

              <div className="bg-blue-50/40 p-5 rounded-2xl border border-blue-100/50 flex gap-4">
                <ShieldCheck className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="space-y-1">
                  <h4 className="text-blue-800 font-bold text-sm font-arabic">صلاحيات الحساب الحالية</h4>
                  <p className="text-xs text-blue-700 leading-relaxed font-arabic">
                    حسابك يتمتع بصلاحيات <strong>({getRoleArabic(currentUser?.role)})</strong> في المنصة، مما يتيح لك تصفح المشروعات ومتابعة مؤشرات الأداء والقطاعات المختلفة بشكل لحظي. لحماية بياناتك، يرجى عدم مشاركة كلمة المرور الخاصة بك مع أي شخص.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Setting
