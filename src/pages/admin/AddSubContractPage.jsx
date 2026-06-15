import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Upload, X, Trash2, Loader2, Save, ArrowRight,
  FileText, Link2, User, Wallet, BadgeCheck, ChevronDown, Info
} from 'lucide-react'
import { fetchAllContracts, addSupplementaryContract } from '../../api/contractsApi'
import { getCurrencyLabel, formatCurrencyVal } from '../../api/currencyUtils'

// Helper: render multi-currency values as compact text
const renderValuesText = (valuesMap, fallbackAmount, fallbackCur = 'EGP') => {
  if (valuesMap && typeof valuesMap === 'object' && Object.keys(valuesMap).length > 0) {
    return Object.entries(valuesMap)
      .filter(([, v]) => Number(v) > 0)
      .map(([cur, val]) => formatCurrencyVal(val, cur))
      .join(' + ') || formatCurrencyVal(fallbackAmount, fallbackCur)
  }
  return formatCurrencyVal(fallbackAmount, fallbackCur)
}
import toast from 'react-hot-toast'

// ── Status options ──────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'Draft',        label: 'مسودة',         color: 'bg-gray-100 text-gray-600' },
  { value: 'Under Review', label: 'قيد المراجعة',  color: 'bg-yellow-100 text-yellow-700' },
  { value: 'Approved',     label: 'معتمد',          color: 'bg-blue-100 text-blue-700' },
  { value: 'Signed',       label: 'موقّع',          color: 'bg-green-100 text-green-700' },
  { value: 'Cancelled',    label: 'ملغى',           color: 'bg-red-100 text-red-700' },
]

// ── Small badge helper ─────────────────────────────────────────
function StatusDot({ value }) {
  const opt = STATUS_OPTIONS.find(s => s.value === value)
  if (!opt) return null
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${opt.color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {opt.label}
    </span>
  )
}

export default function AddSubContractPage() {
  const navigate      = useNavigate()
  const [searchParams] = useSearchParams()
  const fileInputRef  = useRef(null)

  // Pre-fill parent if navigated from a contract row
  const preselectedParent = searchParams.get('parentId') ?? ''

  const [contracts, setContracts]           = useState([])
  const [loadingContracts, setLoadingContracts] = useState(true)
  const [loading, setLoading]               = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFiles, setSelectedFiles]   = useState([])
  const [previews, setPreviews]             = useState([])
  const [dragging, setDragging]             = useState(false)

  const [formData, setFormData] = useState({
    parentContractId : preselectedParent,
    contractorName   : '',
    status           : 'Draft',
    description      : '',
  })

  const [currenciesData, setCurrenciesData] = useState([
    { currency: 'EGP', value: '', paid: '' }
  ])

  // ── Load parent-contract options ──────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAllContracts()
        setContracts(data)
      } catch {
        toast.error('فشل في تحميل قائمة العقود الأصلية')
      } finally {
        setLoadingContracts(false)
      }
    }
    load()
  }, [])

  // ── File helpers ──────────────────────────────────────────────
  const addFiles = (files) => {
    const valid = files.filter(f => f.type.startsWith('image/'))
    if (valid.length !== files.length) toast.error('يُقبل ملفات الصور فقط (JPG، PNG، …)')
    setSelectedFiles(prev => [...prev, ...valid])
    setPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))])
  }

  const removeFile = (i) => {
    URL.revokeObjectURL(previews[i])
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))
    setPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  const onDragOver  = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = ()  => setDragging(false)
  const onDrop      = (e) => {
    e.preventDefault()
    setDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.parentContractId) return toast.error('يرجى اختيار العقد الأصلي (الأب)')
    if (!formData.contractorName)   return toast.error('يرجى إدخال اسم المقاول')
    if (currenciesData.some(c => !c.value)) return toast.error('يرجى إدخال قيمة الملحق')
    if (selectedFiles.length === 0) return toast.error('يرجى إرفاق صورة أو مستند واحد على الأقل')

    setLoading(true)
    setUploadProgress(0)

    try {
      const fd = new FormData()
      fd.append('contractorName', formData.contractorName)
      fd.append('status',         formData.status)
      fd.append('description',    formData.description)
      
      const values = {}
      const paidAmounts = {}
      currenciesData.forEach(item => {
        if (item.value) values[item.currency] = Number(item.value)
        if (item.paid) paidAmounts[item.currency] = Number(item.paid)
      })
      fd.append('values', JSON.stringify(values))
      fd.append('paidAmounts', JSON.stringify(paidAmounts))
      selectedFiles.forEach(f => fd.append('images', f))

      await addSupplementaryContract(formData.parentContractId, fd, pct => setUploadProgress(pct))

      toast.success('تم حفظ الملحق التعاقدي بنجاح ✓')
      navigate('/add-contract')
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء الحفظ')
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  // ── Derived ───────────────────────────────────────────────────
  const parentContract = contracts.find(c => c._id === formData.parentContractId)

  // Compute per-currency remaining
  const renderRemaining = (contract) => {
    if (!contract) return null
    const vals = contract.values
    if (vals && typeof vals === 'object' && Object.keys(vals).length > 0) {
      return Object.entries(vals)
        .filter(([, v]) => Number(v) > 0)
        .map(([cur, val]) => {
          const paid = contract.paidAmounts?.[cur] ?? 0
          return formatCurrencyVal(Number(val) - Number(paid), cur)
        })
        .join(' + ')
    }
    return formatCurrencyVal(
      Number(contract.contractValue ?? 0) - Number(contract.paidAmount ?? 0),
      'EGP'
    )
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up pb-16" dir="rtl">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-4"
          >
            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
              <ArrowRight size={18} />
            </div>
            <span className="text-sm font-bold">العودة</span>
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600 shadow-sm">
              <Link2 size={22} />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">إضافة ملحق تعاقدي</h1>
          </div>
          <p className="text-gray-500 text-sm mr-14">أنشئ ملحقًا (عقد فرعي) مرتبطًا بعقد أصلي موجود مع رفع المستندات الداعمة.</p>
        </div>

        {/* Status badge preview */}
        <div className="hidden md:flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100">
          <BadgeCheck size={20} className="text-violet-500" />
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">الحالة المختارة</p>
            <StatusDot value={formData.status} />
          </div>
        </div>
      </div>

      {/* ── Main Form ───────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ─── Left Column: Details ─────────────────────────── */}
        <div className="lg:col-span-5 space-y-6">

          {/* Parent Contract Card */}
          <div className="bg-white rounded-3xl p-7 shadow-xl shadow-gray-200/50 border border-gray-100 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <Link2 size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">العقد الأصلي</h2>
            </div>

            <div className="space-y-2">
              <label className="label-field">اختر العقد الأصلي</label>
              {loadingContracts ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-3">
                  <Loader2 size={16} className="animate-spin" /> جاري تحميل العقود…
                </div>
              ) : (
                <div className="relative">
                  <select
                    className="select-field"
                    value={formData.parentContractId}
                    onChange={e => setFormData({ ...formData, parentContractId: e.target.value })}
                    required
                  >
                    <option value="">-- اختر العقد الأب --</option>
                    {contracts.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.contractorName} — {c.projectId?.title || 'غير معروف'} ({renderValuesText(c.values, c.contractValue)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Parent info strip */}
            {parentContract && (
              <div className="rounded-2xl bg-violet-50 border border-violet-100 p-4 space-y-2.5 text-sm animate-fade-in-up">
                <div className="flex justify-between items-center pb-1 border-b border-violet-200/50">
                  <span className="text-gray-500 font-medium">المشروع التابع له</span>
                  <span className="font-bold text-violet-950 text-xs bg-white px-2.5 py-1 rounded-lg border border-violet-200/40">
                    {parentContract.projectId?.title || 'غير معروف'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">قيمة العقد الأصلي</span>
                  <span className="font-bold text-gray-800">{renderValuesText(parentContract.values, parentContract.contractValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">المبلغ المسدّد</span>
                  <span className="font-bold text-green-600">{renderValuesText(parentContract.paidAmounts, parentContract.paidAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">المتبقي</span>
                  <span className="font-bold text-red-500">{renderRemaining(parentContract)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">الحالة الحالية</span>
                  <StatusDot value={parentContract.status ?? 'Draft'} />
                </div>
                {parentContract.description && (
                  <div className="pt-2 border-t border-violet-200/60 mt-1">
                    <span className="text-gray-500 block mb-1 font-medium">وصف العقد الأصلي:</span>
                    <p className="text-gray-700 leading-relaxed text-xs bg-white/70 p-2.5 rounded-xl border border-violet-100/60 max-h-24 overflow-y-auto whitespace-pre-line">
                      {parentContract.description}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contract Details Card */}
          <div className="bg-white rounded-3xl p-7 shadow-xl shadow-gray-200/50 border border-gray-100 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <FileText size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">بيانات الملحق</h2>
            </div>

            {/* Contractor Name */}
            <div className="space-y-2">
              <label className="label-field"><User size={15} /> اسم المقاول / الجهة المنفذة</label>
              <input
                type="text"
                required
                placeholder="اسم الشركة أو المقاول"
                className="input-field"
                value={formData.contractorName}
                onChange={e => setFormData({ ...formData, contractorName: e.target.value })}
              />
            </div>

            {/* Multi-Currency Values */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="label-field mb-0"><Wallet size={15} /> قيم الملحق والمبالغ المدفوعة</label>
                <button
                  type="button"
                  onClick={() => setCurrenciesData([...currenciesData, { currency: 'USD', value: '', paid: '' }])}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  + إضافة عملة أخرى
                </button>
              </div>
              
              {currenciesData.map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 relative">
                  {currenciesData.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrenciesData(currenciesData.filter((_, i) => i !== idx))}
                      className="absolute top-2 left-2 text-red-400 hover:text-red-600 p-1"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-xs text-gray-500 font-bold">العملة</label>
                    <select
                      className="select-field py-2 text-sm"
                      value={item.currency}
                      onChange={e => {
                        const nd = [...currenciesData]
                        nd[idx].currency = e.target.value
                        setCurrenciesData(nd)
                      }}
                    >
                      {['EGP', 'USD', 'EUR', 'SAR', 'AED', 'GBP', 'KWD', 'QAR', 'BHD', 'OMR'].map(c => (
                        <option key={c} value={c}>{getCurrencyLabel(c)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-xs text-gray-500 font-bold">قيمة الملحق</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="0.00"
                      className="input-field py-2 text-sm font-mono font-bold"
                      value={item.value}
                      onChange={e => {
                        const nd = [...currenciesData]
                        nd[idx].value = e.target.value
                        setCurrenciesData(nd)
                      }}
                    />
                  </div>
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-xs text-gray-500 font-bold">المبلغ المدفوع</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      className="input-field py-2 text-sm font-mono font-bold border-green-200 focus:border-green-400"
                      value={item.paid}
                      onChange={e => {
                        const nd = [...currenciesData]
                        nd[idx].paid = e.target.value
                        setCurrenciesData(nd)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="label-field"><BadgeCheck size={15} /> حالة الملحق</label>
              <div className="relative">
                <select
                  className="select-field"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="label-field">ملاحظات أو وصف</label>
              <textarea
                rows={3}
                className="input-field resize-none py-3 leading-relaxed"
                placeholder="تفاصيل إضافية حول بنود الملحق…"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          {/* Info tip */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700">
            <Info size={18} className="flex-shrink-0 mt-0.5" />
            <p>سيتم ربط هذا الملحق بالعقد الأصلي المختار وإضافة قيمته إلى الإجمالي التراكمي للعقد تلقائيًا.</p>
          </div>
        </div>

        {/* ─── Right Column: Upload ─────────────────────────── */}
        <div className="lg:col-span-7 space-y-6">

          {/* Drop Zone */}
          <div
            className={`relative bg-white rounded-3xl border-2 border-dashed transition-all duration-200 p-12 flex flex-col items-center justify-center min-h-[340px] shadow-sm cursor-pointer
              ${dragging ? 'border-violet-400 bg-violet-50 scale-[1.01]' : selectedFiles.length > 0 ? 'border-violet-300 bg-violet-50/40' : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/20'}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={e => addFiles(Array.from(e.target.files))}
            />

            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-all shadow-inner
              ${dragging ? 'bg-violet-200 text-violet-700 scale-110' : 'bg-violet-100 text-violet-500'}`}>
              <Upload size={38} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight text-center">
              {dragging ? 'أفلت الملفات هنا…' : 'إرفاق مستندات الملحق'}
            </h3>
            <p className="text-gray-500 text-sm text-center max-w-xs mx-auto mb-8">
              اسحب الصور وأفلتها هنا، أو انقر للتصفح. (JPG، PNG، WEBP)
            </p>
            <div className="inline-flex items-center gap-2 bg-violet-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-violet-200 hover:bg-violet-700 transition-colors">
              <Upload size={18} /> تصفح الملفات
            </div>
          </div>

          {/* Preview Grid */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in-up">
              {previews.map((src, i) => (
                <div key={i} className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-md hover:shadow-xl transition-all">
                  <img src={src} alt={`preview-${i}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); removeFile(i) }}
                      className="w-10 h-10 bg-red-500 text-white rounded-xl shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform flex items-center justify-center"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-black/50 text-white text-[10px] text-center py-0.5 rounded-lg truncate px-1">
                      {selectedFiles[i]?.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Progress */}
          {loading && (
            <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 space-y-3 animate-fade-in-up">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-violet-600 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  جاري رفع المستندات…
                </span>
                <span className="text-gray-800">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-violet-500 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(124,58,237,0.4)]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary px-8 py-4 rounded-2xl text-base"
            >
              <X size={18} /> إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || selectedFiles.length === 0}
              className="px-14 py-4 rounded-2xl bg-violet-600 text-white text-base font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-3"
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={20} /> جاري الحفظ…</>
              ) : (
                <><Save size={20} /> حفظ الملحق التعاقدي</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
