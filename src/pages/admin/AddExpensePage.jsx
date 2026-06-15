import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Banknote, Calendar, FileText, Loader2, Save, ArrowRight, User, ShoppingBag, Tag } from 'lucide-react'
import { createExpense } from '../../api/financeApi'
import { fetchProjects, fetchProjectById } from '../../api/projectsApi'
import { getCurrencyLabel, getProjectCurrencies, formatCurrencyVal, normalizeBudgets, normalizeCurrencyCode } from '../../api/currencyUtils'
import toast from 'react-hot-toast'

export default function AddExpensePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [projectCurrencies, setProjectCurrencies] = useState(['EGP'])
  const [projectExpenses, setProjectExpenses] = useState([])
  const [formData, setFormData] = useState({
    projectId: '',
    amount: '',
    currency: 'EGP',
    category: 'مواد خام وتوريدات',
    vendor: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'معتمد'
  })

  useEffect(() => {
    fetchProjects().then(setProjects).catch(() => toast.error('فشل في تحميل المشاريع'))
  }, [])

  // When project changes, load its budget currencies + existing expenses for budget tracking
  useEffect(() => {
    if (!formData.projectId) {
      setSelectedProject(null)
      setProjectCurrencies(['EGP'])
      setProjectExpenses([])
      setFormData(prev => ({ ...prev, currency: 'EGP' }))
      return
    }

    const loadProjectData = async () => {
      try {
        const [proj, expData] = await Promise.all([
          fetchProjectById(formData.projectId),
          import('../../api/financeApi').then(m => m.fetchProjectExpenses(formData.projectId))
        ])
        setSelectedProject(proj)
        const currencies = getProjectCurrencies(normalizeBudgets(proj.budgets, proj.totalBudget))
        setProjectCurrencies(currencies)
        // Default currency to the first one in the project's budget
        setFormData(prev => ({ ...prev, currency: currencies[0] || 'EGP' }))
        setProjectExpenses(expData?.expenses || [])
      } catch (err) {
        toast.error('فشل في تحميل بيانات المشروع')
      }
    }
    loadProjectData()
  }, [formData.projectId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Calculate spent per currency from project expenses
  const getSpentForCurrency = (currency) => {
    const selectedCurrency = normalizeCurrencyCode(currency)
    return projectExpenses
      .filter(e => normalizeCurrencyCode(e.currency) === selectedCurrency)
      .reduce((sum, e) => sum + (e.amount || 0), 0)
  }

  const getBudgetForCurrency = (currency) => {
    return normalizeBudgets(selectedProject?.budgets, selectedProject?.totalBudget)[normalizeCurrencyCode(currency)] || 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.projectId) return toast.error('يرجى اختيار المشروع')
    if (!formData.currency) return toast.error('يرجى اختيار العملة')
    
    const currency = normalizeCurrencyCode(formData.currency)

    setLoading(true)
    try {
      await createExpense({
        ...formData,
        amount: Number(formData.amount),
        currency,
        expenseCurrency: currency,
        date: new Date(formData.date).toISOString()
      })
      toast.success('تم إضافة طلب المصروف بنجاح، في انتظار المراجعة')
      navigate('/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء إضافة المصروف')
    } finally {
      setLoading(false)
    }
  }

  const currentBudget = getBudgetForCurrency(formData.currency)
  const currentSpent = getSpentForCurrency(formData.currency)
  const remaining = currentBudget - currentSpent

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up pb-12">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-4">
            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
              <ArrowRight size={18} />
            </div>
            <span className="text-sm font-bold">العودة</span>
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">تسجيل مصروفات المشروع</h1>
          <p className="text-gray-500 mt-1">وثق كافة التكاليف والمصروفات الجارية لضمان دقة الرقابة المالية.</p>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
           <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
              <ShoppingBag size={24} />
           </div>
           <div className="pl-4">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">النوع</p>
              <p className="text-sm font-bold text-gray-700">تكاليف تشغيلية</p>
           </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="p-8 space-y-8">
              {/* Project Selection */}
              <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-4">
                <label className="label-field">تخصيص للمشروع المستهدف</label>
                <select
                  name="projectId"
                  required
                  className="select-field bg-white"
                  value={formData.projectId}
                  onChange={handleChange}
                >
                  <option value="">-- اختر المشروع من القائمة --</option>
                  {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                </select>
              </div>

              {/* Financial Core */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="label-field">قيمة المصروف</label>
                  <div className="relative group">
                    <input
                      type="number"
                      name="amount"
                      required
                      placeholder="0.00"
                      className="input-field pr-14 text-xl font-mono font-bold text-red-600 border-red-100 focus:border-red-500 focus:ring-red-500/10"
                      value={formData.amount}
                      onChange={handleChange}
                    />
                    <div className="absolute right-0 top-0 bottom-0 px-4 flex items-center justify-center bg-red-50 border-r border-red-100 rounded-r-xl font-bold text-red-500 text-xs transition-colors">
                       {formData.currency}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="label-field">العملة</label>
                  <select
                    name="currency"
                    required
                    className="select-field"
                    value={formData.currency}
                    onChange={handleChange}
                    disabled={!formData.projectId}
                  >
                    {!formData.projectId && (
                      <option value="">اختر المشروع أولاً</option>
                    )}
                    {projectCurrencies.map(code => (
                      <option key={code} value={code}>
                        {getCurrencyLabel(code)}
                      </option>
                    ))}
                  </select>
                  {formData.projectId && formData.currency && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      الميزانية المتاحة:{' '}
                      <span className={remaining < 0 ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>
                        {formatCurrencyVal(remaining, formData.currency)}
                      </span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="label-field">تاريخ العملية</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="date"
                      required
                      className="input-field pl-10"
                      value={formData.date}
                      onChange={handleChange}
                    />
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label-field">فئة التكلفة</label>
                  <select
                    name="category"
                    className="select-field"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={!formData.projectId}
                  >
                    {!formData.projectId && <option value="">اختر المشروع أولاً</option>}
                    {formData.projectId && (
                      <>
                        <option value="مواد خام وتوريدات">مواد خام وتوريدات</option>
                        <option value="أجور وعمالة فنية">أجور وعمالة فنية</option>
                        <option value="إيجار معدات">إيجار معدات</option>
                        <option value="شراء معدات">شراء معدات</option>
                        <option value="مستخلصات مقاولي باطن">مستخلصات مقاولي باطن</option>
                        <option value="مصاريف إدارية أخرى">مصاريف إدارية أخرى</option>
                        <option value="خدمات فنية واستشارية">خدمات فنية واستشارية</option>
                        <option value="مصاريف تشغيلية">مصاريف تشغيلية</option>
                        <option value="أخرى">أخرى</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="label-field">المورد / المسلم</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="vendor"
                      required
                      placeholder="اسم الشركة أو الجهة"
                      className="input-field pr-10"
                      value={formData.vendor}
                      onChange={handleChange}
                    />
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="label-field">ملاحظات وسبب الصرف</label>
                <textarea
                  name="description"
                  rows="4"
                  placeholder="اكتب هنا تفاصيل الفاتورة أو سبب هذا المصروف..."
                  className="input-field py-4 resize-none leading-relaxed"
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>

            {/* Actions */}
            <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row gap-4">
               <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 py-5 rounded-3xl text-xl font-bold justify-center bg-red-600 hover:bg-red-700 shadow-2xl shadow-red-500/20 border-none"
              >
                {loading ? <Loader2 className="animate-spin" size={28} /> : <Save size={28} />}
                تسجيل المصروف وتحديث الميزانية
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
        </div>

        {/* Sidebar Status */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-3">
                 <Tag size={20} className="text-primary" /> ملخص القيد
              </h3>
              <div className="space-y-6">
                 <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">المبلغ المطلوب</p>
                    <div className="text-3xl font-black text-red-600 font-mono">
                       {formData.amount ? Number(formData.amount).toLocaleString() : '0.00'} <span className="text-sm font-bold">{formData.currency}</span>
                    </div>
                 </div>

                 {/* Budget summary per selected currency */}
                 {selectedProject && formData.currency && (
                   <div className="space-y-2">
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">وضع الميزانية — {formData.currency}</p>
                     <div className="space-y-1.5 text-xs">
                       <div className="flex justify-between">
                         <span className="text-gray-500">الميزانية الكلية</span>
                         <span className="font-bold text-blue-800">{formatCurrencyVal(currentBudget, formData.currency)}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-500">المنصرف</span>
                         <span className="font-bold text-orange-600">{formatCurrencyVal(currentSpent, formData.currency)}</span>
                       </div>
                       <div className="flex justify-between border-t pt-1.5">
                         <span className="text-gray-500">المتبقي</span>
                         <span className={`font-bold ${remaining < 0 ? 'text-red-500' : 'text-green-600'}`}>
                           {formatCurrencyVal(remaining, formData.currency)}
                         </span>
                       </div>
                     </div>
                     {/* Budget bar */}
                     {currentBudget > 0 && (
                       <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                         <div
                           className={`h-2 rounded-full transition-all ${
                             (currentSpent / currentBudget) > 0.9 ? 'bg-red-500' :
                             (currentSpent / currentBudget) > 0.7 ? 'bg-orange-500' : 'bg-green-500'
                           }`}
                           style={{ width: `${Math.min((currentSpent / currentBudget) * 100, 100)}%` }}
                         />
                       </div>
                     )}
                   </div>
                 )}

                 <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-gray-500">الفئة:</span>
                       <span className="font-bold text-gray-800">{formData.category}</span>
                    </div>
                 </div>

                 <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                    <FileText size={18} className="text-blue-600 mt-1 shrink-0" />
                    <p className="text-[11px] text-blue-800 leading-relaxed italic">
                       سيتم خصم هذا المبلغ من ميزانية عملة {formData.currency} المخصصة للمشروع.
                    </p>
                 </div>
              </div>
           </div>

           {/* All currencies budget overview for selected project */}
           {selectedProject && projectCurrencies.length > 1 && (
             <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
               <h3 className="font-bold text-gray-800 mb-4 text-sm border-b pb-3">ميزانيات المشروع (كل العملات)</h3>
               <div className="space-y-3">
                 {projectCurrencies.map(c => {
                   const b = getBudgetForCurrency(c)
                   const s = getSpentForCurrency(c)
                   const pct = b > 0 ? Math.min((s / b) * 100, 100) : 0
                   return (
                     <div key={c} className="space-y-1">
                       <div className="flex justify-between text-xs">
                         <span className="font-bold text-gray-700">{c}</span>
                         <span className="text-gray-500">{formatCurrencyVal(b - s, c)} متبقي</span>
                       </div>
                       <div className="w-full bg-gray-100 rounded-full h-1.5">
                         <div
                           className={`h-1.5 rounded-full ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-orange-400' : 'bg-primary'}`}
                           style={{ width: `${pct}%` }}
                         />
                       </div>
                     </div>
                   )
                 })}
               </div>
             </div>
           )}
        </div>
      </form>
    </div>
  )
}
