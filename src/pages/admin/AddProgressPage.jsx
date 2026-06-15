import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, FileText, Loader2, Save, ArrowRight, Percent, Info } from 'lucide-react'
import { fetchProjects } from '../../api/projectsApi'
import { createSubmission } from '../../api/submissionApi'
import toast from 'react-hot-toast'

export default function AddProgressPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState([])
  const [formData, setFormData] = useState({
    projectId: '',
    progressPercentage: '',
    executionDetails: ''
  })

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await fetchProjects()
        setProjects(data)
      } catch (error) {
        toast.error('فشل في تحميل قائمة المشروعات')
      }
    }
    loadProjects()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.projectId) return toast.error('يرجى اختيار المشروع')
    
    if (formData.progressPercentage < 0 || formData.progressPercentage > 100) {
      return toast.error('نسبة الإنجاز يجب أن تكون بين 0 و 100')
    }

    setLoading(true)
    try {
      await createSubmission('progress', {
        projectId: formData.projectId,
        progressPercentage: Number(formData.progressPercentage),
        executionDetails: formData.executionDetails
      })
      toast.success('تم رفع نسبة الإنجاز للمراجعة بنجاح')
      navigate('/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء إضافة نسبة الإنجاز')
    } finally {
      setLoading(false)
    }
  }

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
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">تسجيل نسبة الإنجاز</h1>
          <p className="text-gray-500 mt-1">قم بتحديث نسبة إنجاز المشروع الفنية وتوثيق تفاصيل التنفيذ.</p>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
           <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
              <CheckCircle2 size={24} />
           </div>
           <div className="pl-4">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">نوع الطلب</p>
              <p className="text-sm font-bold text-gray-700">تحديث فني</p>
           </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="p-8 space-y-8">
              {/* Project Context */}
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

              {/* Progress Core */}
              <div className="space-y-2">
                <label className="label-field">نسبة الإنجاز الفعلية (%)</label>
                <div className="relative group max-w-xs">
                  <input
                    type="number"
                    name="progressPercentage"
                    required
                    min="0"
                    max="100"
                    placeholder="0"
                    className="input-field pr-14 text-xl font-mono font-bold text-blue-600 border-blue-100 focus:border-blue-500 focus:ring-blue-500/10"
                    value={formData.progressPercentage}
                    onChange={handleChange}
                  />
                  <div className="absolute right-0 top-0 bottom-0 px-4 flex items-center justify-center bg-blue-50 border-r border-blue-100 rounded-r-xl font-bold text-blue-500 text-xs transition-colors">
                      <Percent size={16} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="label-field">تفاصيل التنفيذ (ما تم إنجازه)</label>
                <textarea
                  name="executionDetails"
                  rows="5"
                  required
                  placeholder="اكتب هنا تفاصيل الأعمال المنفذة وموقف المشروع الفني..."
                  className="input-field py-4 resize-none leading-relaxed"
                  value={formData.executionDetails}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>

            {/* Actions */}
            <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row gap-4">
               <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 py-5 rounded-3xl text-xl font-bold justify-center bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-500/20 border-none"
              >
                {loading ? <Loader2 className="animate-spin" size={28} /> : <Save size={28} />}
                إرسال للاعتماد والمراجعة
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
                 <Info size={20} className="text-primary" /> ملخص التحديث
              </h3>
              <div className="space-y-6">
                 <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">النسبة الجديدة المقترحة</p>
                    <div className="text-3xl font-black text-blue-600 font-mono">
                       {formData.progressPercentage || '0'} <span className="text-sm font-bold">%</span>
                    </div>
                 </div>

                 <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-gray-500">حالة الطلب:</span>
                       <span className="badge badge-warning px-2">بانتظار المراجعة</span>
                    </div>
                 </div>

                 <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                    <FileText size={18} className="text-blue-600 mt-1 shrink-0" />
                    <p className="text-[11px] text-blue-800 leading-relaxed italic">
                       سيتم إرسال هذا التحديث للمراجعة من قبل الإدارة الفنية. لن تنعكس هذه النسبة على لوحة تحكم المشروع إلا بعد الموافقة عليها.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </form>
    </div>
  )
}
