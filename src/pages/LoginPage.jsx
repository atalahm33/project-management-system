import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Eye, EyeOff, Lock, User, Loader2,
  BarChart3, AlertTriangle, FileText, TrendingUp,
  CheckCircle2, Clock3, Shield, FolderOpen
} from 'lucide-react'

/* ── Sidebar color palette ── */
/* bg: #0D1B2E → #1E3A5F  (exact match) */

const CARDS = [
  { icon: BarChart3, label: 'إحصائيات المشروعات', sub: 'تحليل الميزانيات والأداء', color: 'from-blue-500 to-cyan-500', pos: { top: '10%', right: '5%' }, delay: '0s' },
  { icon: AlertTriangle, label: '٣ مشروعات متأخرة', sub: 'تنبيه فوري', color: 'from-amber-500 to-orange-500', pos: { top: '28%', left: '3%' }, delay: '0.25s' },
  { icon: TrendingUp, label: '٧٢٪ نسبة الإنجاز', sub: 'المشروعات الجارية', color: 'from-emerald-500 to-teal-500', pos: { top: '52%', right: '4%' }, delay: '0.5s' },
  { icon: FileText, label: 'تقرير PDF', sub: 'تصدير التقارير الشاملة', color: 'from-indigo-500 to-purple-500', pos: { top: '68%', left: '8%' }, delay: '0.75s' },
  { icon: Clock3, label: 'متابعة لحظية', sub: 'آخر تحديث: الآن', color: 'from-sky-500 to-blue-500', pos: { top: '82%', right: '12%' }, delay: '1s' },
  { icon: FolderOpen, label: '+١٢٠ مشروع', sub: 'قيد التنفيذ', color: 'from-rose-500 to-pink-500', pos: { top: '20%', left: '15%' }, delay: '1.25s' },
]

const ROLES = [
  { value: 'admin', label: 'مدير النظام', icon: '👑' },
  { value: 'official', label: 'مسؤول', icon: '🏛️' },
  { value: 'viewer', label: 'مشاهد', icon: '👁️' },
]

/* Steps: 0=idle, 1=username shown, 2=password shown, 3=role shown, 4=button shown */
const TOTAL_STEPS = 4

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ username: '', password: '', role: 'admin' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /* Animation states */
  const [leftReady, setLeftReady] = useState(false)  // left panel slides in
  const [rightReady, setRightReady] = useState(false)  // right panel fades in
  const [step, setStep] = useState(0)       // form build step
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  /* Staggered entrance */
  useEffect(() => {
    const t1 = setTimeout(() => setLeftReady(true), 100)
    const t2 = setTimeout(() => setRightReady(true), 500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  /* Build form fields one by one after right panel appears */
  useEffect(() => {
    if (!rightReady) return
    let s = 0
    const iv = setInterval(() => {
      s += 1
      setStep(s)
      if (s >= TOTAL_STEPS) clearInterval(iv)
    }, 220)
    return () => clearInterval(iv)
  }, [rightReady])

  /* Mouse parallax for left panel */
  useEffect(() => {
    const onMove = (e) =>
      setMouse({
        x: (e.clientX / window.innerWidth - 0.5) * 16,
        y: (e.clientY / window.innerHeight - 0.5) * 16,
      })
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'خطأ في تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex overflow-hidden" dir="rtl">

      {/* ══════════════════════════════════════
          LEFT PANEL — Brand (Sidebar colors)
         ══════════════════════════════════════ */}
      <div
        className={`hidden lg:flex flex-col justify-between w-[44%] min-h-screen relative overflow-hidden
                    text-white transition-all duration-700 ease-out
                    ${leftReady ? 'translate-x-0 opacity-100' : 'translate-x-[-60px] opacity-0'}`}
        style={{ background: 'linear-gradient(175deg, #0D1B2E 0%, #1E3A5F 100%)' }}
      >
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize: '52px 52px'
          }}
        />

        {/* Glowing orbs */}
        <div className="absolute top-[-15%] right-[-15%] w-[55%] h-[55%] bg-blue-500/15 blur-[110px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] bg-indigo-700/15 blur-[90px] rounded-full pointer-events-none" />

        {/* ── das.png LARGE WATERMARK ── */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
          <img
            src="/images/das.png"
            alt=""
            aria-hidden="true"
            className="w-[480px] h-[480px] object-contain opacity-[0.08] animate-float-wm"
          />
        </div>

        {/* ── Floating cards (mouse parallax) ── */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {CARDS.map((c, i) => (
            <div
              key={i}
              className="absolute transition-[transform] duration-150 ease-out"
              style={{
                ...c.pos,
                transform: ` translate(
              ${mouse.x * (i % 2 === 0 ? 0.45 : -0.3)}px,
              ${mouse.y * (i % 2 === 0 ? 0.3 : -0.45)}px
             )`,
              }}
            >
              <div
                className={`bg-gradient-to-br ${c.color} rounded-2xl px-4 py-3
                            shadow-2xl border border-white/20 backdrop-blur-sm
                            animate-float-card`}
                style={{ animationDelay: c.delay }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <c.icon size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm leading-tight">{c.label}</div>
                    <div className="text-white/70 text-[11px]">{c.sub}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Top – Logo */}
        <div className="relative z-20 p-10">
          <img src="/images/das.png" alt="NSPO" className="h-20 w-auto object-contain drop-shadow-lg" />
        </div>

        {/* Middle – Tagline */}
        <div className="relative z-20 px-10 ">
          <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.2] mb-5 drop-shadow-md">
            بوابة إدارة<br />
            <span className="text-blue-300">المشروعات </span>
          </h1>
          <p className="text-blue-200/70 text-base leading-relaxed max-w-xs">
            منصة متكاملة لمتابعة المشروعات، رصد الأداء، إدارة التمويل، وإصدار التقارير القومية.
          </p>
        </div>

        {/* Bottom – Copyright */}
        <div className="relative z-20 px-10 pb-10 text-blue-400/40 text-xs">
          © {new Date().getFullYear()} NSPO IT Solutions - جهاز مشروعات الخدمة الوطنية — جميع الحقوق محفوظة
        </div>
      </div>

      {/* ══════════════════════════════════════
          RIGHT PANEL — Login Form
         ══════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12 relative overflow-hidden">

        {/* Subtle dots background */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #0D1B2E 1px, transparent 1px)',
            backgroundSize: '36px 36px'
          }}
        />

        {/* Right panel fade+scale in */}
        <div
          className={`relative z-10 w-full max-w-md transition-all duration-700 ease-out
                      ${rightReady ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'}`}
        >
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/80 border border-slate-100 p-9">

            {/* Mobile logo */}
            <div className="flex justify-center mb-5 lg:hidden">
              <img src="/images/das.png" alt="NSPO" className="h-14 object-contain" />
            </div>

            {/* Icon bubble */}
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-300/30"
                style={{ background: 'linear-gradient(135deg, #1E3A5F, #0D1B2E)' }}>
                <Shield size={26} className="text-white" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-center text-2xl font-extrabold text-slate-800 mb-1">تسجيل الدخول</h2>
            <p className="text-center text-slate-400 text-sm mb-8">
              جهاز مشروعات الخدمة الوطنية — بوابة إدارة المشاريع
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* ── STEP 1: Username ── */}
              <div className={`transition-all duration-500 ease-out
                              ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">اسم المستخدم</label>
                <div className="relative">
                  <User size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="أدخل اسم المستخدم"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10
                               text-slate-800 placeholder:text-slate-400
                               focus:outline-none focus:ring-2 focus:border-blue-900
                               transition-all duration-200"
                    style={{ '--tw-ring-color': '#1E3A5F' }}
                  />
                </div>
              </div>

              {/* ── STEP 2: Password ── */}
              <div className={`transition-all duration-500 ease-out
                              ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">كلمة المرور</label>
                <div className="relative">
                  <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="أدخل كلمة المرور"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 pl-10
                               text-slate-800 placeholder:text-slate-400
                               focus:outline-none focus:ring-2 focus:border-blue-900
                               transition-all duration-200"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>


              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm
                                px-4 py-2.5 rounded-xl flex items-center gap-2">
                  <Shield size={14} />
                  {error}
                </div>
              )}

              {/* ── STEP 4: Submit button ── */}
              <div className={`transition-all duration-500 ease-out
                              ${step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white font-extrabold py-3.5 rounded-xl mt-1
                             shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl
                             disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #0D1B2E 100%)' }}
                >
                  {loading
                    ? <><Loader2 size={18} className="animate-spin" /> جارٍ تسجيل الدخول…</>
                    : <><CheckCircle2 size={18} /> دخول إلى المنصة</>
                  }
                </button>
              </div>
            </form>

            <p className="text-center text-slate-400 text-xs mt-7">
              © {new Date().getFullYear()} NSPO IT Solutions - جهاز مشروعات الخدمة الوطنية
            </p>
          </div>
        </div>
      </div>

      {/* ── Global Animations ── */}
      <style>{`
        /* Floating cards gentle bob */
        @keyframes float-card {
          0%, 100% { transform: translateY(0px);   }
          50%       { transform: translateY(-9px);  }
        }
        .animate-float-card {
          animation: float-card 4s ease-in-out infinite;
        }

        /* Large watermark slow float */
        @keyframes float-wm {
          0%, 100% { transform: translateY(0px) scale(1);     }
          50%       { transform: translateY(-16px) scale(1.03);}
        }
        .animate-float-wm {
          animation: float-wm 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}