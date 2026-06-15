import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Save, X, Loader2, AlertCircle, CheckCircle2, Building2, Calendar, LayoutGrid, AlertTriangle, ShieldCheck, ArrowRight, Wallet, Banknote } from 'lucide-react'
import { createProject } from '../../api/projectsApi'
import { fetchSectors } from '../../api/sectorsApi'
import { fetchCompanies } from '../../api/companiesApi'
import { useAuth } from '../../context/AuthContext'
import { CURRENCY_CODES, getCurrencyLabel, normalizeCurrencyCode } from '../../api/currencyUtils'
import toast from 'react-hot-toast'

const AMOUNT_UNIT_MULTIPLIER = {
  million: 1e6,
  billion: 1e9,
}

function SearchableSelect({ name, value, onChange, options, placeholder, required }) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = React.useRef(null)

  // Find currently selected option
  const selectedOption = options.find(opt => opt.value === value)

  // When dropdown is closed, input displays the selected option's label.
  // When dropdown is open, input displays what the user types to search.
  const displayValue = isOpen ? search : (selectedOption ? selectedOption.label : '')

  // Filter options based on search query
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (opt) => {
    onChange({ target: { name, value: opt.value } })
    setIsOpen(false)
    setSearch('')
  }

  const handleFocus = () => {
    setIsOpen(true)
    setSearch('')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          required={required}
          type="text"
          placeholder={placeholder}
          value={displayValue}
          onFocus={handleFocus}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:ring-4 focus:ring-primary/10 focus:border-primary focus:outline-none cursor-pointer text-right font-arabic"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-50 custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-150">
          {filteredOptions.length === 0 ? (
            <div className="p-3 text-center text-xs text-gray-400 font-arabic">
              لا توجد نتائج مطابقة
            </div>
          ) : (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt)}
                className={`px-4 py-2.5 text-xs cursor-pointer transition-colors text-right font-arabic hover:bg-slate-50 ${ opt.value === value ? 'bg-primary-50 text-primary font-bold' : 'text-gray-700'
                  }`}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function AddProjectPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [sectors, setSectors] = useState([])
  const [companies, setCompanies] = useState([])
  const [budgetEntries, setBudgetEntries] = useState([{ currency: 'EGP', amount: '', amountUnit: 'million' }])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    beneficiaryEntity: '',
    sectorId: '',
    companyId: '',
    status: 'قيد التنفيذ',
    projectDate: '',
    projectLocation: '',
    location: {
      type: 'Point',
      coordinates: [31.2357, 30.0444]
    },
    risks: []
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sectorsData, companiesData] = await Promise.all([
          fetchSectors(),
          fetchCompanies()
        ])
        setSectors(sectorsData)
        setCompanies(companiesData)
      } catch (error) {
        toast.error('فشل في تحميل البيانات الأساسية')
      }
    }
    loadData()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRiskChange = (index, field, value) => {
    const newRisks = [...formData.risks]
    newRisks[index][field] = value
    setFormData(prev => ({ ...prev, risks: newRisks }))
  }

  const addRiskField = () => {
    setFormData(prev => ({
      ...prev,
      risks: [...prev.risks, { description: '', severity: 'متوسط', mitigationPlan: '', status: 'نشط' }]
    }))
  }

  const removeRiskField = (index) => {
    const newRisks = formData.risks.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, risks: newRisks }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Build budgets object from entries
      const budgets = {}
      let hasValidBudget = false
      for (const entry of budgetEntries) {
        const multiplier = AMOUNT_UNIT_MULTIPLIER[entry.amountUnit] || AMOUNT_UNIT_MULTIPLIER.million
        const amt = Number(entry.amount) * multiplier
        if (entry.currency && amt > 0) {
          const currency = normalizeCurrencyCode(entry.currency)
          budgets[currency] = (budgets[currency] || 0) + amt
          hasValidBudget = true
        }
      }
      if (!hasValidBudget) {
        toast.error('يرجى إدخال ميزانية واحدة على الأقل')
        setLoading(false)
        return
      }
      const payload = {
        ...formData,
        budgets,
        // Keep totalBudget synced to EGP budget for legacy compatibility
        totalBudget: budgets['EGP'] || Object.values(budgets)[0] || 0,
        createdBy: user?._id
      }
      const result = await createProject(payload)
      const newProjectId = result?.data?.project?._id
      toast.success('تم إنشاء المشروع! يرجى مراجعته واعتماده لنشره.')
      // Redirect to self-review page instead of projects list
      if (newProjectId) {
        navigate(`/review-project/${newProjectId}`)
      } else {
        navigate('/projects')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء إضافة المشروع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up pb-12">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-4">
            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
              <ArrowRight size={18} />
            </div>
            <span className="text-sm font-bold">العودة للمشروعات</span>
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">إنشاء مشروع  جديد</h1>
          <p className="text-gray-500 mt-1">أدخل كافة البيانات والمستهدفات الخاصة بالمشروع  الجديد.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Section 1: Basic Info */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="bg-gray-50/50 px-8 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <LayoutGrid size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">المعلومات الأساسية</h2>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="label-field">اسم المشروع بالكامل</label>
                <input
                  type="text"
                  name="title"
                  required
                  className="input-field text-lg font-bold"
                  placeholder="مثال: إنشاء مجمع الصناعات الغذائية المتكامل"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label className="label-field">الوصف التفصيلي والهدف</label>
                <textarea
                  name="description"
                  rows="4"
                  required
                  className="input-field py-4 resize-none leading-relaxed"
                  placeholder="اشرح نطاق العمل والأهداف الاستراتيجية لهذا المشروع..."
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
              </div>

              <div className="space-y-2">
                <label className="label-field">الجهة المنفذة</label>
                <input
                  type="text"
                  name="beneficiaryEntity"
                  className="input-field"
                  placeholder="مثال: وزارة الصحة، محافظة القاهرة..."
                  value={formData.beneficiaryEntity}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label-field">القطاع التابع له</label>
                  <SearchableSelect
                    name="sectorId"
                    required
                    value={formData.sectorId}
                    onChange={handleChange}
                    placeholder="-- ابحث واختر القطاع --"
                    options={sectors.map(s => ({ value: s._id, label: s.name }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="label-field">الجهة المستفيدة</label>
                  <SearchableSelect
                    name="companyId"
                    required
                    value={formData.companyId}
                    onChange={handleChange}
                    placeholder="-- ابحث واختر الشركة --"
                    options={companies.map(c => ({ value: c._id, label: c.name_ar || c.name }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="label-field">تاريخ أو موعد المشروع</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="projectDate"
                      required
                      className="input-field pl-10"
                      placeholder="مثال: الربع الثالث 2026، أو تاريخ محدد"
                      value={formData.projectDate}
                      onChange={handleChange}
                    />
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="label-field">الحالة التشغيلية</label>
                  <select
                    name="status"
                    className="select-field"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="قيد التنفيذ">قيد التنفيذ</option>
                    <option value="مكتمل">مكتمل</option>
                    <option value="متوقف">متوقف</option>
                    <option value="مخطط له">مخطط له</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="label-field">موقع المشروع</label>
                <input
                  type="text"
                  name="projectLocation"
                  required
                  className="input-field"
                  placeholder="مثال: العاصمة الإدارية الجديدة، محافظة القاهرة..."
                  value={formData.projectLocation}
                  onChange={handleChange}
                />
              </div>

              {/* Budget Section — Multi-Currency */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="label-field">الميزانية التخطيطية للمشروع (لكل عملة)</label>
                  <button
                    type="button"
                    onClick={() => setBudgetEntries(prev => [...prev, { currency: 'USD', amount: '', amountUnit: 'million' }])}
                    className="flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                  >
                    <Plus size={14} /> إضافة عملة
                  </button>
                </div>

                <div className="space-y-3">
                  {budgetEntries.map((entry, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select
                        className="select-field w-52 shrink-0"
                        value={entry.currency}
                        onChange={e => {
                          const updated = [...budgetEntries]
                          updated[idx].currency = e.target.value
                          setBudgetEntries(updated)
                        }}
                      >
                        {CURRENCY_CODES.map(code => (
                          <option key={code} value={code}>{getCurrencyLabel(code)}</option>
                        ))}
                      </select>
                      <div className="relative flex-1 flex gap-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0"
                          className="input-field text-2xl font-black text-primary font-mono flex-1 min-w-0"
                          value={entry.amount}
                          onChange={e => {
                            const updated = [...budgetEntries]
                            updated[idx].amount = e.target.value
                            setBudgetEntries(updated)
                          }}
                        />
                        <select
                          className="select-field w-28 shrink-0 text-sm font-bold"
                          value={entry.amountUnit || 'million'}
                          onChange={e => {
                            const updated = [...budgetEntries]
                            updated[idx].amountUnit = e.target.value
                            setBudgetEntries(updated)
                          }}
                        >
                          <option value="million">مليون</option>
                          <option value="billion">مليار</option>
                        </select>
                      </div>
                      {budgetEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setBudgetEntries(prev => prev.filter((_, i) => i !== idx))}
                          className="w-9 h-9 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 italic">* أدخل المبلغ ثم اختر الوحدة (مليون أو مليار) — كل عملة حساب مستقل</p>
              </div>
            </div>
          </div>



          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 py-5 rounded-3xl text-xl font-bold justify-center shadow-2xl shadow-primary/30"
            >
            {loading ? <Loader2 className="animate-spin" size={28} /> : <ArrowRight size={28} />}
              حفظ وانتقال للمراجعة
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary px-10 py-5 rounded-3xl text-xl font-bold justify-center bg-white border-2 border-gray-200 text-gray-600"
            >
              إلغاء
            </button>
          </div>
        </div>

        {/* Sidebar Help */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-primary rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-primary/20">
            <ShieldCheck size={60} className="text-white/10 absolute -top-4 -right-4 rotate-12" />
            <h3 className="text-xl font-bold mb-6 relative z-10 flex items-center gap-2">
              <AlertCircle size={24} /> معايير الإضافة
            </h3>
            <ul className="space-y-5 relative z-10">
              <li className="flex gap-4 text-sm text-blue-50 leading-relaxed border-b border-white/10 pb-4">
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold">1</span>
                يرجى إدخال اسم المشروع والوصف التفصيلي بدقة لتسهيل عملية المتابعة.
              </li>
              <li className="flex gap-4 text-sm text-blue-50 leading-relaxed border-b border-white/10 pb-4">
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold">2</span>
                تأكد من اختيار القطاع والشركة المنفذة بدقة لربط التمويل والتقارير بشكل صحيح.
              </li>
              <li className="flex gap-4 text-sm text-blue-50 leading-relaxed border-b border-white/10 pb-4">
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold">3</span>
                سجل المخاطر يساعد في التنبؤ بالعقبات وتوفير خطط بديلة مسبقاً.
              </li>
            </ul>
          </div>

          <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-amber-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600" /> مصفوفة المخاطر
              </h4>
              <button
                type="button"
                onClick={addRiskField}
                className="w-8 h-8 bg-amber-200 text-amber-700 rounded-lg flex items-center justify-center hover:bg-amber-300 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="space-y-4">
              {formData.risks.map((risk, index) => (
                <div key={index} className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100 space-y-4 relative group">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">وصف التهديد / الخطر</label>
                    <input
                      type="text"
                      className="w-full text-sm font-bold bg-transparent outline-none border-b border-gray-100 focus:border-amber-400 py-1 transition-colors"
                      placeholder="مثال: تأخر في توريدات المواد الخام"
                      value={risk.description}
                      onChange={(e) => handleRiskChange(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-gray-400 font-bold">درجة التأثير</span>
                      <select
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-xl outline-none shadow-sm ${ risk.severity === 'عالي' ? 'bg-red-50 text-red-600' :
                          risk.severity === 'متوسط' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                          }`}
                        value={risk.severity}
                        onChange={(e) => handleRiskChange(index, 'severity', e.target.value)}
                      >
                        <option value="منخفض">تأثير منخفض</option>
                        <option value="متوسط">تأثير متوسط</option>
                        <option value="عالي">تأثير مرتفع</option>
                      </select>
                    </div>
                    {formData.risks.length > 1 && (
                      <button onClick={() => removeRiskField(index)} className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-amber-600 italic px-2">
                * سيتم إدراج هذه المخاطر في لوحة مراقبة الأداء.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
