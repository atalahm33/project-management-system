import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X, FileText, Image as ImageIcon, Loader2, Save, Trash2, CheckCircle, AlertCircle, Building2, User, Wallet, ArrowRight } from 'lucide-react'
import { fetchProjects } from '../../api/projectsApi'
import { createContract, fetchAllContracts } from '../../api/contractsApi'
import { getCurrencyLabel, formatCurrencyVal } from '../../api/currencyUtils'
import toast from 'react-hot-toast'

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

export default function AddContractPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [projects, setProjects] = useState([])
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const [formData, setFormData] = useState({
    projectId: '',
    contractorName: '',
    description: '',
    startDate: '',
    startDateDescription: '',
    endDate: '',
    endDateDescription: ''
  })
  
  const [currenciesData, setCurrenciesData] = useState([
    { currency: 'EGP', value: '', paid: '' }
  ])

  // Derived: filter contracts by selected project
  // projectId may be a populated object {_id, title} or a plain string
  const filteredContracts = formData.projectId ? contracts.filter(c => {
    const cPid = typeof c.projectId === 'object' && c.projectId !== null ? c.projectId._id : c.projectId
    return cPid === formData.projectId
  }) : []
  
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previews, setPreviews] = useState([])

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await fetchProjects()
        setProjects(data)
      } catch (error) {
        toast.error('فشل في تحميل قائمة المشروعات')
      }
    }
    const loadContracts = async () => {
      try {
        const data = await fetchAllContracts()
        setContracts(data)
      } catch (error) {
        toast.error('فشل في تحميل قائمة العقود')
      }
    }
    loadProjects()
    loadContracts()
  }, [])

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    addFiles(files)
  }

  const addFiles = (files) => {
  const validFiles = files.filter(
    file =>
      file.type.startsWith('image/') ||
      file.type === 'application/pdf'
  )

  if (validFiles.length !== files.length) {
    toast.error('يرجى اختيار صور أو ملفات PDF فقط')
  }

  setSelectedFiles(prev => [...prev, ...validFiles])

  const newPreviews = validFiles.map(file => {
    if (file.type === 'application/pdf') {
      return {
        type: 'pdf',
        url: null,
        name: file.name
      }
    }

    return {
      type: 'image',
      url: URL.createObjectURL(file),
      name: file.name
    }
  })

  setPreviews(prev => [...prev, ...newPreviews])
}

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    URL.revokeObjectURL(previews[index])
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const onDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const onDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files)
    addFiles(files)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.projectId) return toast.error('يرجى اختيار المشروع')
    if (selectedFiles.length === 0) return toast.error('يرجى رفع صورة العقد أو الأوراق على الأقل')

    setLoading(true)
    setUploadProgress(0)

    try {
      const data = new FormData()
      data.append('projectId', formData.projectId)
      data.append('contractorName', formData.contractorName)
      data.append('description', formData.description)
      if (formData.startDate) data.append('startDate', formData.startDate)
      if (formData.startDateDescription) data.append('startDateDescription', formData.startDateDescription)
      if (formData.endDate) data.append('endDate', formData.endDate)
      if (formData.endDateDescription) data.append('endDateDescription', formData.endDateDescription)
      
      const values = {}
      const paidAmounts = {}
      currenciesData.forEach(item => {
        if (item.value) values[item.currency] = Number(item.value)
        if (item.paid) paidAmounts[item.currency] = Number(item.paid)
      })
      data.append('values', JSON.stringify(values))
      data.append('paidAmounts', JSON.stringify(paidAmounts))
      
      selectedFiles.forEach(file => {
        data.append('images', file)
      })

      await createContract(data, (progress) => {
        setUploadProgress(progress)
      })

      toast.success('تم رفع العقد والبيانات بنجاح')
    
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء الرفع')
    } finally {
      setLoading(false)
      setUploadProgress(0)
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
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">توثيق عقود المشروع</h1>
          <p className="text-gray-500 mt-1">قم برفع النسخ المصورة من العقود والمستندات الرسمية للأرشفة الرقمية.</p>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
           <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <FileText size={24} />
           </div>
           <div className="pl-4">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">الحالة</p>
              <p className="text-sm font-bold text-gray-700">توثيق رسمي</p>
           </div>
        </div>
      </div>

      {/* Supplementary Contract Promo Banner */}
      <div className="mb-6 bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-100 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm" dir="rtl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">هل هذا العقد ملحق أو عقد استكمالي لعقد مشروع قائم؟</h3>
            <p className="text-gray-500 text-sm mt-0.5">يمكنك إضافة عقد استكمالي (ملحق عقد) وربطه بالعقد الرئيسي لتتبع التكاليف بدقة.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/add-subcontract')}
          className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-2"
        >
          <span>إضافة عقد استكمالي (ملحق)</span>
          <ArrowRight size={16} className="rotate-180" />
        </button>
      </div>

      {/* Previous Contracts for Selected Project */}
      {formData.projectId && (
        <div className="mb-8 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50" dir="rtl">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-3 text-lg">
            <Building2 size={22} className="text-primary" /> العقود السابقة لهذا المشروع
          </h3>
          {filteredContracts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 font-bold bg-gray-50/50">
                    <th className="py-3 px-4">المشروع</th>
                    <th className="py-3 px-4">المقاول / الجهة المنفذة</th>
                    <th className="py-3 px-4">قيمة العقد</th>
                    <th className="py-3 px-4">المبلغ المدفوع</th>
                    <th className="py-3 px-4">الوصف / الملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map(contract => {
                    const project = projects.find(p => p._id === contract.projectId)
                    return (
                      <tr key={contract._id} className="border-b border-gray-50 hover:bg-gray-50/30 text-sm">
                        <td className="py-3.5 px-4 font-semibold text-gray-800">{project ? project.title : '---'}</td>
                        <td className="py-3.5 px-4 font-bold text-gray-700">{contract.contractorName}</td>
                        <td className="py-3.5 px-4 font-mono text-xs">{renderValuesText(contract.values, contract.contractValue)}</td>
                        <td className="py-3.5 px-4 font-mono text-xs text-green-600">{renderValuesText(contract.paidAmounts, contract.paidAmount)}</td>
                        <td className="py-3.5 px-4 text-gray-500 text-xs max-w-xs truncate">{contract.description || 'لا يوجد'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">لا توجد عقود مسجلة لهذا المشروع بعد.</p>
          )}
        </div>
      )}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100 space-y-6">
            <div className="flex items-center gap-3 mb-2">
               <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Building2 size={20} />
               </div>
               <h2 className="text-lg font-bold text-gray-800">بيانات التعاقد</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="label-field">المشروع</label>
                <select
                  required
                  className="select-field"
                  value={formData.projectId}
                  onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                >
                  <option value="">-- اختر المشروع --</option>
                  {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="label-field">اسم المقاول / الجهة المنفذة</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="اسم الشركة أو المقاول العام"
                    className="input-field pr-10"
                    value={formData.contractorName}
                    onChange={(e) => setFormData({...formData, contractorName: e.target.value})}
                  />
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="label-field mb-0">المبالغ وقيمة العقد</label>
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
                    <div className="sm:col-span-2 space-y-1">
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
                    <div className="sm:col-span-5 space-y-1">
                      <label className="text-xs text-gray-500 font-bold">قيمة العقد</label>
                      <input
                        type="number"
                        required
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
                    <div className="sm:col-span-5 space-y-1">
                      <label className="text-xs text-gray-500 font-bold">المبلغ المدفوع</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        className="input-field py-2 text-sm font-mono font-bold border-green-200 focus:border-green-500"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="label-field">تاريخ البداية (اختياري)</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="label-field">وصف تاريخ البداية</label>
                  <input
                    type="text"
                    placeholder="مثال: تاريخ تسليم الموقع"
                    className="input-field"
                    value={formData.startDateDescription}
                    onChange={(e) => setFormData({...formData, startDateDescription: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="label-field">تاريخ النهاية (اختياري)</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="label-field">وصف تاريخ النهاية</label>
                  <input
                    type="text"
                    placeholder="مثال: تاريخ التسليم الابتدائي"
                    className="input-field"
                    value={formData.endDateDescription}
                    onChange={(e) => setFormData({...formData, endDateDescription: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="label-field">وصف أو ملاحظات</label>
                <textarea
                  rows="3"
                  className="input-field py-4 resize-none leading-relaxed"
                  placeholder="أي تفاصيل إضافية حول بنود التعاقد..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="lg:col-span-7 space-y-6">
          <div 
            className={`relative bg-white rounded-3xl border-3 border-dashed transition-all p-12 flex flex-col items-center justify-center min-h-[350px] shadow-sm ${
              selectedFiles.length > 0 ? 'border-primary/40 bg-primary/5' : 'border-gray-200 hover:border-primary/50'
            }`}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              accept="image/*,application/pdf"
            />
            
            <div className="text-center group cursor-pointer" onClick={() => fileInputRef.current.click()}>
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary group-hover:scale-110 transition-transform shadow-inner">
                <Upload size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">ارفق صور العقود والمستندات</h3>
              <p className="text-gray-500 max-w-xs mx-auto mb-8 text-sm">اسحب الملفات هنا أو انقر لتصفح جهازك. (يدعم ملفات الصور و PDF)</p>
              <div className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/25 hover:bg-primary-600 transition-colors">
                 تصفح الملفات
              </div>
            </div>
          </div>

          {/* Previews Grid */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in-up">
              {previews.map((previewItem, index) => {
                // Ensure PDFs also have a viewable URL if they have a blob source
                const viewUrl = previewItem.url || (selectedFiles[index] ? URL.createObjectURL(selectedFiles[index]) : '#')
                return (
                  <div key={index} className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-md hover:shadow-xl transition-all">
                    {previewItem.type === 'pdf' ? (
                      <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="w-full h-full bg-red-50 flex flex-col items-center justify-center p-4 gap-2 cursor-pointer hover:bg-red-100/50 transition-colors">
                        <FileText size={48} className="text-red-500" />
                        <span className="text-xs text-red-700 font-bold text-center line-clamp-2 px-2">{previewItem.name}</span>
                        <span className="text-[10px] bg-red-200 text-red-800 px-2 py-0.5 rounded font-bold">فتح الملف (PDF)</span>
                      </a>
                    ) : (
                      <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full cursor-zoom-in">
                        <img src={previewItem.url} alt={`preview ${index}`} className="w-full h-full object-cover" />
                      </a>
                    )}
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                       <button
                         type="button"
                         onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFile(index); }}
                         className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg flex items-center justify-center transition-colors"
                         title="حذف الملف"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Progress Bar */}
          {loading && (
            <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 space-y-3">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-primary flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  جاري تشفير ورفع المستندات...
                </span>
                <span className="text-gray-900">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                <div 
                  className="bg-primary h-full transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(30,58,95,0.5)]" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading || selectedFiles.length === 0}
              className="w-full md:w-auto px-16 py-5 rounded-3xl bg-gray-900 text-white text-xl font-bold hover:bg-black transition-all shadow-2xl shadow-gray-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-4"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  جاري المعالجة...
                </>
              ) : (
                <>
                  <Save size={24} />
                  اعتماد ورفع العقد
                </>
              )}
            </button>
          </div>
        </div>
      </form>


    </div>
  )
}
