import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Wallet, Banknote, Building2, CheckCircle2, Loader2, ArrowRight, AlertTriangle, Info, ShieldCheck } from 'lucide-react'
import { fetchProjects } from '../../api/projectsApi'
import { createFundingAllocation, fetchAvailableCurrencies } from '../../api/financeApi'
import { getCurrencyLabel, getProjectCurrencies, normalizeBudgets, normalizeCurrencyCode } from '../../api/currencyUtils'
import toast from 'react-hot-toast'

export default function AddFundingPage() {
  const { projectId: urlProjectId } = useParams()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    projectId: urlProjectId || '',
    sourceName: '',
    sourceType: 'حكومي',
    committedAmount: '',
    currency: 'EGP',
    description: ''
  })
  const [availableCurrencies, setAvailableCurrencies] = useState([])
  const [projectBudgetCurrencies, setProjectBudgetCurrencies] = useState([])

  useEffect(() => {
    const getProjectsAndCurrencies = async () => {
      try {
        const [projData, currData] = await Promise.all([
          fetchProjects(),
          fetchAvailableCurrencies()
        ])
        setProjects(projData)
        setAvailableCurrencies(currData || ['EGP', 'USD'])
      } catch (err) {
        toast.error('فشل في تحميل البيانات الأساسية')
        setAvailableCurrencies(['EGP', 'USD'])
      } finally {
        setLoading(false)
      }
    }
    getProjectsAndCurrencies()
  }, [])

  useEffect(() => {
    if (!form.projectId) {
      setProjectBudgetCurrencies([])
      return
    }
    const proj = projects.find(p => p._id === form.projectId)
    if (proj) {
      setProjectBudgetCurrencies(
        getProjectCurrencies(normalizeBudgets(proj.budgets, proj.totalBudget))
      )
    }
  }, [form.projectId, projects])

  const isNewFundingCurrency = form.projectId
    && form.currency
    && !projectBudgetCurrencies.includes(normalizeCurrencyCode(form.currency))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.projectId) return toast.error('يرجى اختيار المشروع')
    
    setIsSubmitting(true)
    try {
      await createFundingAllocation(form)
      toast.success(
        isNewFundingCurrency
          ? 'تم إضافة مصدر التمويل — سيظهر تبويب خاص بالعملة في صفحة المشروع'
          : 'تم إضافة مصدر التمويل بنجاح'
      )
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء الحفظ')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-4">
            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
              <ArrowRight size={18} />
            </div>
            <span className="text-sm font-bold">العودة للمشروع</span>
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">إضافة مصدر تمويل جديد</h1>
          <p className="text-gray-500 mt-1">قم بتخصيص الاعتمادات المالية والميزانيات المعتمدة من الجهات المختلفة.</p>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
           <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Wallet size={24} />
           </div>
           <div className="pl-4">
              <p className="text-[10px] text-gray-400 font-bold uppercase">الحالة</p>
              <p className="text-sm font-bold text-gray-700">قيد الإدخال</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="p-8 space-y-8">
              
              {/* Project Selection Section */}
              <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
                    <Building2 size={18} />
                  </div>
                  <h3 className="font-bold text-gray-800">بيانات المشروع الأساسية</h3>
                </div>
                
                <div className="space-y-2">
                  <label className="label-field">اختيار المشروع المستهدف</label>
                  <select 
                    required
                    className="select-field bg-white"
                    value={form.projectId}
                    onChange={e => setForm({...form, projectId: e.target.value})}
                  >
                    <option value="">-- ابحث عن اسم المشروع --</option>
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Funding Details Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">2</div>
                   <h3 className="font-bold text-gray-800">تفاصيل جهة التمويل</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="label-field">اسم الجهة المموّلة</label>
                    <input 
                      required
                      type="text" 
                      className="input-field" 
                      placeholder="مثال: وزارة التخطيط، بنك الاستثمار"
                      value={form.sourceName}
                      onChange={e => setForm({...form, sourceName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="label-field">نوع التمويل</label>
                    <select 
                      className="select-field"
                      value={form.sourceType}
                      onChange={e => setForm({...form, sourceType: e.target.value})}
                    >
                      <option value="حكومي">حكومي (موازنة الدولة)</option>
                      <option value="خاص">خاص (استثماري)</option>
                      <option value="منحة">منحة خارجية</option>
                      <option value="قرض">قرض بنكي</option>
                      <option value="تمويل ذاتي">تمويل ذاتي</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="label-field">المبلغ الإجمالي المعتمد والعملة</label>
                  <div className="flex gap-2">
                    <input 
                      required
                      type="number" 
                      className="input-field text-xl font-mono text-primary font-bold flex-1" 
                      placeholder="0.00"
                      value={form.committedAmount}
                      onChange={e => setForm({...form, committedAmount: e.target.value})}
                    />
                    <select 
                      className="select-field w-32"
                      value={form.currency}
                      onChange={e => setForm({...form, currency: e.target.value})}
                    >
                      {availableCurrencies.map(c => (
                        <option key={c} value={c}>{getCurrencyLabel(c)}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 mr-1 italic">* أدخل المبلغ كما هو مذكور في خطاب الاعتماد الرسمي مع اختيار العملة الصحيحة.</p>
                  {isNewFundingCurrency && (
                    <div className="flex items-start gap-2 p-3 mt-2 bg-amber-50 border border-amber-200 rounded-xl">
                      <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 leading-relaxed">
                        العملة المختارة ({getCurrencyLabel(form.currency)}) غير موجودة في ميزانية المشروع.
                        بعد الاعتماد، سيُضاف تبويب خاص بها في صفحة المشروع لعرض التمويل والعمليات المالية فقط.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="label-field">الوصف والملاحظات الإضافية</label>
                  <textarea 
                    rows="4"
                    className="input-field py-4 resize-none leading-relaxed"
                    placeholder="اكتب هنا أي شروط أو تفاصيل متعلقة بصرف هذا التمويل..."
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Form Footer */}
            <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row gap-4">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-primary flex-1 py-4 rounded-2xl shadow-lg shadow-primary/25 text-lg justify-center hover:-translate-y-0.5 transition-transform"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
                حفظ بيانات التمويل
              </button>
              <button 
                type="button" 
                onClick={() => navigate(-1)}
                className="btn-secondary flex-1 py-4 rounded-2xl justify-center bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
              >
                إلغاء العملية
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-blue-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
             <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                   <ShieldCheck size={28} className="text-blue-200" />
                </div>
                <h3 className="text-xl font-bold mb-4">تدقيق البيانات المالية</h3>
                <p className="text-blue-100/80 text-sm leading-relaxed mb-6">
                  بمجرد إضافة مصدر التمويل، سيتم تحديث التقارير المالية ومؤشرات الأداء (KPIs) للمشروع بشكل لحظي. يرجى مراجعة المبلغ بدقة قبل الحفظ.
                </p>
                <div className="space-y-3">
                   <div className="flex items-center gap-3 text-xs bg-white/5 p-3 rounded-xl border border-white/10">
                      <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                      <span>سيتم مراجعة البيانات من قبل الإدارة المالية</span>
                   </div>
                </div>
             </div>
             {/* Abstract pattern */}
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
          </div>

          <div className="card border-dashed border-2 border-gray-200 bg-gray-50/50">
             <h4 className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2">
                <Info size={16} /> المساعدة السريعة
             </h4>
             <ul className="space-y-4">
                <li className="flex gap-3">
                   <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">1</div>
                   <p className="text-xs text-gray-600">اختر المشروع أولاً لتحديد السياق المالي.</p>
                </li>
                <li className="flex gap-3">
                   <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">2</div>
                   <p className="text-xs text-gray-600">حدد نوع التمويل بدقة لأغراض التقارير القطاعية.</p>
                </li>
                <li className="flex gap-3">
                   <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">3</div>
                   <p className="text-xs text-gray-600">يمكنك تعديل هذه البيانات لاحقاً من صفحة المشروع.</p>
                </li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
