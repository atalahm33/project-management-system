import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowRight, CheckCircle2, Edit3, Eye, Loader2, AlertTriangle,
  Building2, MapPin, Calendar, Wallet, ShieldCheck, Clock,
  Save, X, RefreshCw
} from 'lucide-react'
import { fetchProjectById, updateProject, approveProject } from '../../api/projectsApi'
import { fetchSectors } from '../../api/sectorsApi'
import { fetchCompanies } from '../../api/companiesApi'
import { useAuth } from '../../context/AuthContext'
import { CURRENCY_CODES, getCurrencyLabel, normalizeCurrencyCode } from '../../api/currencyUtils'
import toast from 'react-hot-toast'

const AMOUNT_UNIT_MULTIPLIER = { million: 1e6, billion: 1e9 }

const fmt = (n) => {
  if (!n) return '0'
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} مليار`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} مليون`
  return n.toLocaleString('ar')
}

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
    {Icon && <Icon size={16} className="text-primary mt-0.5 shrink-0" />}
    <div className="flex-1">
      <p className="text-[11px] text-gray-400 font-bold uppercase mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-semibold">{value || '—'}</p>
    </div>
  </div>
)

export default function ReviewProjectPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('view') // 'view' | 'edit'
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  const [sectors, setSectors] = useState([])
  const [companies, setCompanies] = useState([])

  // Edit form state
  const [editData, setEditData] = useState({})
  const [budgetEntries, setBudgetEntries] = useState([{ currency: 'EGP', amount: '', amountUnit: 'million' }])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [proj, sectorsData, companiesData] = await Promise.all([
          fetchProjectById(id),
          fetchSectors(),
          fetchCompanies()
        ])
        setProject(proj)
        setSectors(sectorsData)
        setCompanies(companiesData)
        initEditData(proj)
      } catch {
        toast.error('فشل في تحميل بيانات المشروع')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const initEditData = (proj) => {
    setEditData({
      title: proj.title || '',
      description: proj.description || '',
      beneficiaryEntity: proj.beneficiaryEntity || '',
      sectorId: proj.sectorId?._id || proj.sectorId || '',
      companyId: proj.companyId?._id || proj.companyId || '',
      status: proj.status || 'قيد التنفيذ',
      projectDate: proj.projectDate || '',
      projectLocation: proj.projectLocation || '',
      risks: proj.risks || []
    })
    // Convert budgets map to entries for editing
    const budgets = proj.budgets || {}
    const entries = Object.entries(budgets)
      .filter(([, v]) => v > 0)
      .map(([currency, value]) => {
        if (value >= 1e9) return { currency, amount: String(value / 1e9), amountUnit: 'billion' }
        return { currency, amount: String(value / 1e6), amountUnit: 'million' }
      })
    setBudgetEntries(entries.length > 0 ? entries : [{ currency: 'EGP', amount: '', amountUnit: 'million' }])
  }

  const handleSaveEdits = async () => {
    setSaving(true)
    try {
      const budgets = {}
      for (const entry of budgetEntries) {
        const multiplier = AMOUNT_UNIT_MULTIPLIER[entry.amountUnit] || AMOUNT_UNIT_MULTIPLIER.million
        const amt = Number(entry.amount) * multiplier
        if (entry.currency && amt > 0) {
          budgets[normalizeCurrencyCode(entry.currency)] = (budgets[normalizeCurrencyCode(entry.currency)] || 0) + amt
        }
      }
      const payload = {
        ...editData,
        budgets,
        totalBudget: budgets['EGP'] || Object.values(budgets)[0] || 0
      }
      await updateProject(id, payload)
      toast.success('تم حفظ التعديلات بنجاح')
      // Refresh project data
      const updated = await fetchProjectById(id)
      setProject(updated)
      initEditData(updated)
      setMode('view')
    } catch {
      toast.error('فشل في حفظ التعديلات')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async () => {
    setApproving(true)
    try {
      await approveProject(id)
      toast.success('🎉 تم اعتماد المشروع بنجاح! سيظهر الآن في قائمة المشاريع المتاحة.')
      navigate('/projects')
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل في اعتماد المشروع')
    } finally {
      setApproving(false)
    }
  }

  // ── Guard: only creator can review ──────────────────────────────────────────
  if (!loading && project) {
    const creatorId = project.createdBy?._id || project.createdBy
    const isAdmin = user?.role === 'Admin'
    if (!isAdmin && creatorId?.toString() !== user?._id?.toString()) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertTriangle size={48} className="text-amber-400" />
          <p className="text-xl font-bold text-gray-700">غير مصرح لك بمراجعة هذا المشروع</p>
          <button onClick={() => navigate('/projects')} className="btn-primary px-8 py-3 rounded-xl">
            العودة للمشاريع
          </button>
        </div>
      )
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
        <p className="text-gray-400">جاري تحميل بيانات المشروع...</p>
      </div>
    )
  }

  if (!project) return null

  const alreadyApproved = project.approvalStatus === 'approved'

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up pb-16" dir="rtl">

      {/* ── Header ── */}
      <div className="mb-8">
        <button onClick={() => navigate('/projects')} className="group flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-5">
          <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
            <ArrowRight size={18} />
          </div>
          <span className="text-sm font-bold">العودة للمشروعات</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {alreadyApproved ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                  <CheckCircle2 size={13} /> معتمد
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                  <Clock size={13} /> قيد المراجعة
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              {mode === 'edit' ? 'تعديل المشروع' : 'مراجعة المشروع'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {mode === 'edit'
                ? 'عدّل البيانات ثم احفظها، أو اعتمد المشروع مباشرة'
                : 'راجع جميع البيانات بدقة قبل الاعتماد النهائي'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {!alreadyApproved && mode === 'view' && (
              <button
                onClick={() => setMode('edit')}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:border-primary hover:text-primary transition-all shadow-sm"
              >
                <Edit3 size={16} />
                تعديل البيانات
              </button>
            )}
            {mode === 'edit' && (
              <>
                <button
                  onClick={() => { setMode('view'); initEditData(project) }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-200 text-gray-500 rounded-xl font-bold text-sm hover:border-red-300 hover:text-red-500 transition-all"
                >
                  <X size={16} />
                  إلغاء التعديل
                </button>
                <button
                  onClick={handleSaveEdits}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  حفظ التعديلات
                </button>
              </>
            )}
            {!alreadyApproved && mode === 'view' && (
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20"
              >
                {approving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                اعتماد المشروع
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Already Approved Banner ── */}
      {alreadyApproved && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
          <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
          <div>
            <p className="font-bold text-emerald-800">هذا المشروع معتمد ومنشور</p>
            <p className="text-sm text-emerald-600">
              تم الاعتماد في {project.approvedAt ? new Date(project.approvedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
            </p>
          </div>
        </div>
      )}

      {/* ── Pending Banner ── */}
      {!alreadyApproved && mode === 'view' && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle size={22} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800">المشروع في انتظار اعتمادك</p>
            <p className="text-sm text-amber-600">
              راجع جميع البيانات أدناه. يمكنك التعديل إذا لزم الأمر، ثم اضغط "اعتماد المشروع" لنشره في قائمة المشاريع المتاحة.
            </p>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      {mode === 'view' ? (
        <ViewMode project={project} />
      ) : (
        <EditMode
          editData={editData}
          setEditData={setEditData}
          budgetEntries={budgetEntries}
          setBudgetEntries={setBudgetEntries}
          sectors={sectors}
          companies={companies}
        />
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
//  VIEW MODE COMPONENT
// ────────────────────────────────────────────────────────────────────────────
function ViewMode({ project }) {
  const budgets = project.budgets || {}
  const budgetEntries = Object.entries(budgets).filter(([, v]) => v > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Info */}
      <div className="lg:col-span-2 space-y-6">

        {/* Basic Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">المعلومات الأساسية</h3>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <p className="text-[11px] text-gray-400 font-bold uppercase mb-1">اسم المشروع</p>
              <p className="text-xl font-extrabold text-gray-900">{project.title}</p>
            </div>
            <div className="mb-4">
              <p className="text-[11px] text-gray-400 font-bold uppercase mb-1">الوصف التفصيلي</p>
              <p className="text-sm text-gray-700 leading-relaxed">{project.description || '—'}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <InfoRow label="الجهة المنفذة" value={project.beneficiaryEntity} />
              <InfoRow label="القطاع" value={project.sectorId?.name} icon={Building2} />
              <InfoRow label="الجهة المستفيدة" value={project.companyId?.name_ar || project.companyId?.name} icon={Building2} />
              <InfoRow label="موقع المشروع" value={project.projectLocation} icon={MapPin} />
              <InfoRow label="تاريخ / موعد المشروع" value={project.projectDate} icon={Calendar} />
              <InfoRow label="الحالة التشغيلية" value={project.status} />
            </div>
          </div>
        </div>

        {/* Budget Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Wallet size={16} className="text-primary" /> الميزانية التخطيطية
            </h3>
          </div>
          <div className="p-6">
            {budgetEntries.length > 0 ? (
              <div className="space-y-3">
                {budgetEntries.map(([currency, value]) => (
                  <div key={currency} className="flex items-center justify-between p-4 bg-blue-50/60 rounded-xl border border-blue-100">
                    <span className="text-sm font-bold text-blue-800">{getCurrencyLabel(currency)}</span>
                    <span className="text-lg font-extrabold text-blue-900">{fmt(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">لم يتم إدخال ميزانية</p>
            )}
          </div>
        </div>

        {/* Risks Card */}
        {project.risks && project.risks.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
              <h3 className="font-bold text-amber-800 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" /> مصفوفة المخاطر
              </h3>
            </div>
            <div className="p-6 space-y-3">
              {project.risks.map((risk, i) => (
                <div key={i} className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-sm font-bold text-gray-800">{risk.description}</p>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 ${
                      risk.severity === 'عالي' ? 'bg-red-100 text-red-600' :
                      risk.severity === 'متوسط' ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {risk.severity}
                    </span>
                  </div>
                  {risk.mitigationPlan && (
                    <p className="text-[12px] text-gray-500">{risk.mitigationPlan}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar - Meta */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-700 mb-4 text-sm">معلومات الإنشاء</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-[11px] text-gray-400">أنشئ بواسطة</p>
              <p className="font-semibold text-gray-800">{project.createdBy?.name || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400">تاريخ الإنشاء</p>
              <p className="font-semibold text-gray-800">
                {project.createdAt ? new Date(project.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400">حالة الاعتماد</p>
              <p className={`font-bold ${project.approvalStatus === 'approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {project.approvalStatus === 'approved' ? '✓ معتمد' : '⏳ قيد المراجعة'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-primary/5 rounded-2xl border border-primary/10 p-5">
          <h3 className="font-bold text-primary mb-3 text-sm flex items-center gap-2">
            <ShieldCheck size={16} /> خطوات المراجعة
          </h3>
          <ol className="space-y-3 text-xs text-gray-600">
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-bold text-[10px]">1</span>
              راجع جميع البيانات الأساسية
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-bold text-[10px]">2</span>
              عدّل أي بيانات غير صحيحة
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-bold text-[10px]">3</span>
              اضغط "اعتماد المشروع" للنشر
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
//  EDIT MODE COMPONENT
// ────────────────────────────────────────────────────────────────────────────
function EditMode({ editData, setEditData, budgetEntries, setBudgetEntries, sectors, companies }) {
  const handle = (e) => {
    const { name, value } = e.target
    setEditData(prev => ({ ...prev, [name]: value }))
  }

  const handleRisk = (index, field, value) => {
    const risks = [...editData.risks]
    risks[index][field] = value
    setEditData(prev => ({ ...prev, risks }))
  }

  const addRisk = () => setEditData(prev => ({
    ...prev,
    risks: [...prev.risks, { description: '', severity: 'متوسط', mitigationPlan: '', status: 'نشط' }]
  }))

  const removeRisk = (i) => setEditData(prev => ({
    ...prev,
    risks: prev.risks.filter((_, idx) => idx !== i)
  }))

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <h3 className="font-bold text-blue-800 flex items-center gap-2">
            <Edit3 size={16} /> تعديل المعلومات الأساسية
          </h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">اسم المشروع</label>
            <input name="title" value={editData.title} onChange={handle}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">الوصف التفصيلي</label>
            <textarea name="description" value={editData.description} onChange={handle} rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none leading-relaxed" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">الجهة المنفذة</label>
            <input name="beneficiaryEntity" value={editData.beneficiaryEntity} onChange={handle}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">القطاع</label>
              <select name="sectorId" value={editData.sectorId} onChange={handle}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none bg-white">
                <option value="">اختر القطاع</option>
                {sectors.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">الجهة المستفيدة</label>
              <select name="companyId" value={editData.companyId} onChange={handle}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none bg-white">
                <option value="">اختر الجهة</option>
                {companies.map(c => <option key={c._id} value={c._id}>{c.name_ar || c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">تاريخ / موعد المشروع</label>
              <input name="projectDate" value={editData.projectDate} onChange={handle}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">الحالة التشغيلية</label>
              <select name="status" value={editData.status} onChange={handle}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none bg-white">
                <option value="قيد التنفيذ">قيد التنفيذ</option>
                <option value="مكتمل">مكتمل</option>
                <option value="متوقف">متوقف</option>
                <option value="مخطط له">مخطط له</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">موقع المشروع</label>
            <input name="projectLocation" value={editData.projectLocation} onChange={handle}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" />
          </div>
        </div>
      </div>

      {/* Budget */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <h3 className="font-bold text-blue-800 flex items-center gap-2">
            <Wallet size={16} /> الميزانية التخطيطية
          </h3>
          <button type="button"
            onClick={() => setBudgetEntries(prev => [...prev, { currency: 'USD', amount: '', amountUnit: 'million' }])}
            className="text-xs text-primary font-bold flex items-center gap-1 hover:underline">
            + إضافة عملة
          </button>
        </div>
        <div className="p-6 space-y-3">
          {budgetEntries.map((entry, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <select value={entry.currency}
                onChange={e => { const u = [...budgetEntries]; u[idx].currency = e.target.value; setBudgetEntries(u) }}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white w-40 shrink-0 focus:border-primary outline-none">
                {CURRENCY_CODES.map(c => <option key={c} value={c}>{getCurrencyLabel(c)}</option>)}
              </select>
              <input type="number" min="0" step="any" value={entry.amount}
                onChange={e => { const u = [...budgetEntries]; u[idx].amount = e.target.value; setBudgetEntries(u) }}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-primary outline-none" placeholder="0" />
              <select value={entry.amountUnit}
                onChange={e => { const u = [...budgetEntries]; u[idx].amountUnit = e.target.value; setBudgetEntries(u) }}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white w-28 shrink-0 focus:border-primary outline-none">
                <option value="million">مليون</option>
                <option value="billion">مليار</option>
              </select>
              {budgetEntries.length > 1 && (
                <button type="button" onClick={() => setBudgetEntries(prev => prev.filter((_, i) => i !== idx))}
                  className="w-9 h-9 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Risks */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
          <h3 className="font-bold text-amber-800 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" /> مصفوفة المخاطر
          </h3>
          <button type="button" onClick={addRisk}
            className="w-7 h-7 bg-amber-200 text-amber-700 rounded-lg flex items-center justify-center hover:bg-amber-300 transition-colors text-lg font-bold">+</button>
        </div>
        <div className="p-6 space-y-3">
          {editData.risks.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">لا توجد مخاطر مسجلة — اضغط + لإضافة</p>
          )}
          {editData.risks.map((risk, i) => (
            <div key={i} className="bg-amber-50/40 p-4 rounded-xl border border-amber-100 space-y-3">
              <div className="flex gap-2">
                <input value={risk.description} onChange={e => handleRisk(i, 'description', e.target.value)}
                  placeholder="وصف الخطر..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-amber-400 outline-none bg-white" />
                <select value={risk.severity} onChange={e => handleRisk(i, 'severity', e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:border-amber-400 outline-none w-32 shrink-0">
                  <option value="منخفض">منخفض</option>
                  <option value="متوسط">متوسط</option>
                  <option value="عالي">عالي</option>
                </select>
                {editData.risks.length > 0 && (
                  <button onClick={() => removeRisk(i)}
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shrink-0">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
