import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/authApi'
import { Eye, EyeOff, Lock, User, Shield, Loader2 } from 'lucide-react'

const ROLES = [
  { value: 'admin',   label: 'مدير النظام',  icon: '👑' },
  { value: 'official', label: 'مسؤول',        icon: '🏛️' },
  { value: 'viewer',  label: 'مشاهد',         icon: '👁️' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', role: 'admin' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen login-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-5">
        {[...Array(20)].map((_, i) => (
          <div key={i}
            className="absolute rounded-full border border-white"
            style={{
              width: `${60 + i * 40}px`, height: `${60 + i * 40}px`,
              top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
              transform: 'translate(-50%,-50%)',
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Card */}
        <div className="card-glass p-8 border border-white/20">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/30
                            flex items-center justify-center mx-auto mb-4 text-3xl">
              🏛️
            </div>
            <h1 className="text-2xl font-bold text-white">منصة إدارة المشاريع الوطنية</h1>
            <p className="text-blue-200 text-sm mt-1">الجهاز الوطني للمشاريع</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="label text-blue-100">اسم المستخدم</label>
              <div className="relative">
                <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="input pr-9"
                  placeholder="أدخل اسم المستخدم"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label text-blue-100">كلمة المرور</label>
              <div className="relative">
                <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-9 pl-9"
                  placeholder="أدخل كلمة المرور"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="label text-blue-100">نوع الحساب</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: r.value }))}
                    className={`py-2.5 px-2 rounded-xl border text-center transition-all text-xs font-medium
                      ${form.role === r.value
                        ? 'bg-white text-navy border-white font-bold'
                        : 'border-white/20 text-blue-100 hover:bg-white/10'}`}
                  >
                    <div className="text-lg mb-0.5">{r.icon}</div>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm
                              px-4 py-2.5 rounded-lg flex items-center gap-2">
                <Shield size={14} />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full btn-primary justify-center py-3 text-base mt-2
                         bg-white text-navy hover:bg-gray-100 disabled:opacity-60">
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> جارٍ تسجيل الدخول...</>
                : 'تسجيل الدخول'
              }
            </button>
          </form>

          <p className="text-center text-blue-300 text-xs mt-6">
            © {new Date().getFullYear()} الجهاز الوطني للمشاريع – جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  )
}
