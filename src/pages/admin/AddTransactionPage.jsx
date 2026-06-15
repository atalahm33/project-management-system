import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Banknote, CreditCard, Building2, CheckCircle2, Loader2, ArrowRight, Wallet, History, ReceiptText, CalendarCheck } from 'lucide-react'
import { fetchProjects } from '../../api/projectsApi'
import { fetchProjectAllocations, createFundingTransaction } from '../../api/financeApi'
import { getCurrencyLabel, normalizeCurrencyCode } from '../../api/currencyUtils'
import toast from 'react-hot-toast'

export default function AddTransactionPage() {
  const { projectId: urlProjectId, sourceId: urlSourceId } = useParams()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [allocations, setAllocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingAllocations, setLoadingAllocations] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    projectId: urlProjectId || '',
    fundingSourceId: urlSourceId || '',
    amount: '',
    currency: 'EGP',
    paymentMethod: 'تحويل بنكي',
    referenceNumber: '',
    description: ''
  })
  useEffect(() => {
    const getProjects = async () => {
      try {
        const projData = await fetchProjects()
        setProjects(projData)
      } catch (err) {
        toast.error('خطأ في تحميل البيانات')
      } finally {
        setLoading(false)
      }
    }
    getProjects()
  }, [])

  useEffect(() => {
    if (!form.projectId) {
      setAllocations([])
      return
    }

    const getAllocations = async () => {
      setLoadingAllocations(true)
      try {
        const data = await fetchProjectAllocations(form.projectId)
        setAllocations(data)

        if (data.length === 0) {
          setForm(prev => ({ ...prev, fundingSourceId: '', currency: 'EGP' }))
        } else if (urlSourceId && data.some(a => a._id === urlSourceId)) {
          const source = data.find(a => a._id === urlSourceId)
          setForm(prev => ({
            ...prev,
            fundingSourceId: urlSourceId,
            currency: normalizeCurrencyCode(source?.currency)
          }))
        } else {
          setForm(prev => ({
            ...prev,
            fundingSourceId: data[0]._id,
            currency: normalizeCurrencyCode(data[0].currency)
          }))
        }
      } catch (err) {
        toast.error('خطأ في تحميل مصادر التمويل')
      } finally {
        setLoadingAllocations(false)
      }
    }
    getAllocations()
  }, [form.projectId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.projectId) return toast.error('يرجى اختيار المشروع')
    if (!form.fundingSourceId) return toast.error('يرجى اختيار مصدر التمويل')
    
    setIsSubmitting(true)
    try {
      await createFundingTransaction(form)
      toast.success('تم تسجيل الدفعة بنجاح')
      navigate(`/projects/${form.projectId}`)
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

  const selectedSource = allocations.find(a => a._id === form.fundingSourceId)

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
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">تسجيل معاملة مالية</h1>
          <p className="text-gray-500 mt-1">قم بتسجيل الدفعات المستلمة فعلياً لتعزيز السيولة المالية للمشروع.</p>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
           <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
              <Banknote size={24} />
           </div>
           <div className="pl-4">
              <p className="text-[10px] text-gray-400 font-bold uppercase">النوع</p>
              <p className="text-sm font-bold text-gray-700">دفعة مستلمة</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="p-8 space-y-8">
              
              {/* Project & Source Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                <div className="space-y-2">
                  <label className="label-field">المشروع</label>
                  <select 
                    required
                    className="select-field bg-white"
                    value={form.projectId}
                    onChange={e => setForm({...form, projectId: e.target.value})}
                  >
                    <option value="">-- اختر المشروع --</option>
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label-field">مصدر التمويل</label>
                  <div className="relative">
                    <select 
                      required
                      disabled={!form.projectId || loadingAllocations}
                      className="select-field bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={form.fundingSourceId}
                      onChange={e => {
                        const source = allocations.find(a => a._id === e.target.value)
                        setForm({
                          ...form,
                          fundingSourceId: e.target.value,
                          currency: source ? normalizeCurrencyCode(source.currency) : 'EGP'
                        })
                      }}
                    >
                      <option value="">{loadingAllocations ? 'جاري التحميل...' : '-- اختر مصدر التمويل --'}</option>
                      {allocations.map(a => (
                        <option key={a._id} value={a._id}>{a.sourceName}</option>
                      ))}
                    </select>
                    {loadingAllocations && (
                      <div className="absolute left-10 top-1/2 -translate-y-1/2">
                        <Loader2 className="animate-spin text-primary" size={16} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm">2</div>
                   <h3 className="font-bold text-gray-800">بيانات الدفعة المالية</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="label-field">قيمة المبلغ المستلم والعملة</label>
                    <div className="flex gap-2">
                      <input 
                        required
                        type="number" 
                        className="input-field text-xl font-mono text-green-600 font-bold border-green-200 focus:border-green-500 focus:ring-green-500/10 flex-1" 
                        placeholder="0.00"
                        value={form.amount}
                        onChange={e => setForm({...form, amount: e.target.value})}
                      />
                      <select 
                        className="select-field w-32 border-green-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        value={form.currency}
                        disabled={!form.fundingSourceId}
                        title="العملة مرتبطة بمصدر التمويل المختار"
                      >
                        {selectedSource ? (
                          <option value={form.currency}>{getCurrencyLabel(form.currency)}</option>
                        ) : (
                          <option value="">--</option>
                        )}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="label-field">وسيلة الدفع / التحويل</label>
                    <select 
                      className="select-field"
                      value={form.paymentMethod}
                      onChange={e => setForm({...form, paymentMethod: e.target.value})}
                    >
                      <option value="تحويل بنكي">تحويل بنكي (Swift/EFT)</option>
                      <option value="شيك">شيك بنكي مقبول الدفع</option>
                      <option value="نقدي">نقدي (توريد خزينة)</option>
                      <option value="أخرى">أخرى (سندات/أذون)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="label-field">رقم العملية / المرجع البنكي</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="input-field pr-12 font-mono tracking-wider uppercase" 
                      placeholder="TR-XXXX-XXXX"
                      value={form.referenceNumber}
                      onChange={e => setForm({...form, referenceNumber: e.target.value})}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <ReceiptText size={20} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="label-field">وصف المعاملة</label>
                  <textarea 
                    rows="3"
                    className="input-field py-4 resize-none leading-relaxed"
                    placeholder="تفاصيل إضافية حول هذه المعاملة المالية..."
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row gap-4">
              <button 
                type="submit" 
                disabled={isSubmitting || !form.fundingSourceId}
                className="btn-primary flex-1 py-4 rounded-2xl shadow-lg shadow-green-500/25 text-lg justify-center bg-green-600 hover:bg-green-700 hover:-translate-y-0.5 transition-all border-none"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
                تأكيد تسجيل المعاملة
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

        {/* Info Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
             <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-3">
                <History size={20} className="text-green-600" /> ملخص العملية
             </h4>
             
             <div className="space-y-6">
                <div className="space-y-1">
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">المبلغ المكتوب</p>
                   <div className="text-2xl font-black text-green-600 font-mono">
                      {form.amount ? Number(form.amount).toLocaleString() : '0.00'} <span className="text-sm font-bold">{form.currency}</span>
                   </div>
                </div>

                <div className="p-4 bg-green-50 rounded-2xl border border-green-100 space-y-3">
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">من جهة:</span>
                      <span className="font-bold text-green-800">{selectedSource?.sourceName || '---'}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">النوع:</span>
                      <span className="badge badge-success px-2">{selectedSource?.sourceType || '---'}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">وسيلة الدفع:</span>
                      <span className="font-bold text-green-800">{form.paymentMethod}</span>
                   </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                   <CalendarCheck size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                   <p className="text-[11px] text-amber-800 leading-relaxed">
                      يرجى التأكد من أن تاريخ العملية المسجل يطابق تاريخ التحويل الفعلي الظاهر في كشف الحساب البنكي.
                   </p>
                </div>
             </div>
          </div>

          <div className="card border-none bg-blue-900 text-white p-6 shadow-xl relative overflow-hidden">
             <h4 className="font-bold text-sm mb-3 flex items-center gap-2 relative z-10">
                <Wallet size={16} /> رصيد الجهة الحالي
             </h4>
             <div className="relative z-10">
                <p className="text-xs text-blue-200 mb-1">المتبقي من الاعتماد المعتمد:</p>
                <p className="text-xl font-bold font-mono">
                  {selectedSource ? (selectedSource.committedAmount - selectedSource.receivedAmount).toLocaleString() : '0.00'} {selectedSource?.currency || 'EGP'}
                </p>
             </div>
             <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
