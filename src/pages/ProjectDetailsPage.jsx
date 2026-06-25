import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight, Calendar, MapPin, Building2,
  DollarSign, TrendingUp, Loader2, CheckCircle2, Circle, AlertTriangle, ShieldCheck, Info, X,
  Wallet, CreditCard, History, ArrowDownToLine, Banknote, Plus, Download, FileText,
  GitBranch, LayoutGrid, ExternalLink
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { fetchProjectById } from '../api/projectsApi'
import { fetchProjectExpenses, downloadProjectReport } from '../api/financeApi'
import { getProjectCurrencies, getAllProjectCurrencies, isFundingOnlyCurrency, getCurrencyLabel, formatCurrencyVal, normalizeBudgets, normalizeCurrencyCode } from '../api/currencyUtils'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import StatusBadge from '../components/StatusBadge'
import ProgressBar from '../components/ProgressBar'

const COLORS = ['#1E3A5F', '#2D6A4F', '#B5460F', '#5A189A', '#0077B6', '#F39C12']

const fmt = n => {
  if (!n) return '0'
  if (n >= 1e9) return `${ (n / 1e9).toFixed(2) } مليار`
  if (n >= 1e6) return `${ (n / 1e6).toFixed(1) } مليون`
  return n.toLocaleString('ar')
}

const getImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const host = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace('/api', '')
  return `${ host }${ path }`
}

const CircularProgress = ({ value, label, color }) => {
  const r = 40, i = 2 * Math.PI * r
  const stroke = i - (value / 100) * i
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#F4F7FA" strokeWidth="10" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={i} strokeDashoffset={stroke}
            style={{ transition: 'stroke-dashoffset 1s ease' }}
            strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-800">{value}%</span>
        </div>
      </div>
      <p className="text-xs font-semibold text-gray-600 text-center">{label}</p>
    </div>
  )
}

const renderMultiCurrency = (valuesMap, fallbackValue) => {
  if (valuesMap && Object.keys(valuesMap).length > 0) {
    return (
      <div className="flex flex-col gap-0.5 items-end">
        {Object.entries(valuesMap).map(([cur, val]) => (
          <span key={cur} className="text-[10px] whitespace-nowrap">{formatCurrencyVal(val, cur)}</span>
        ))}
      </div>
    );
  }
  return <span className="text-[11px] whitespace-nowrap">{fmt(fallbackValue)} ج.م</span>;
};

const renderMultiCurrencyRemaining = (valuesMap, paidMap, fallbackRemaining) => {
  if (valuesMap && Object.keys(valuesMap).length > 0) {
    return (
      <div className="flex flex-col gap-0.5 items-end">
        {Object.entries(valuesMap).map(([cur, val]) => {
          const paid = paidMap?.[cur] || 0;
          return <span key={cur} className="text-[10px] whitespace-nowrap">{formatCurrencyVal(val - paid, cur)}</span>
        })}
      </div>
    );
  }
  return <span className="text-[11px] whitespace-nowrap">{fmt(fallbackRemaining)} ج.م</span>;
};

// ── Recursive Contract Node for Tree View ────────────────────────
function ContractNode({ contract, allContracts, depth = 0, setSelectedImage, getImageUrl, fmt }) {
  const children = allContracts.filter(c => c.parentContractId === contract._id)

  return (
    <div className={`flex flex-col ${ depth > 0 ? 'mr-6 md:mr-10 border-r-2 border-indigo-100/70 pr-4 md:pr-6 relative mt-4' : 'mt-2' }`} dir="rtl">
      {/* Visual horizontal indicator link */}
      {depth > 0 && (
        <div className="absolute right-0 top-10 w-4 md:w-6 h-0.5 bg-indigo-150" style={{ right: '-2px' }} />
      )}

      <div className={`p-5 rounded-2xl border transition-all ${ depth === 0
          ? 'bg-white border-gray-150 shadow-sm hover:shadow-md'
          : 'bg-indigo-50/15 border-indigo-100/30 hover:bg-indigo-50/25'
        }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${ depth === 0 ? 'bg-indigo-50 border border-indigo-100 text-indigo-600' : 'bg-white border border-indigo-100/40 text-violet-600'
              }`}>
              <Building2 size={20} />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-sm md:text-base leading-snug">{contract.contractorName}</h4>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">رمز العقد: {contract._id}</p>
            </div>
          </div>
          <span className={`self-start sm:self-center px-3 py-1 rounded-full text-[10px] font-bold border shrink-0 ${ depth === 0
              ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
              : 'bg-violet-50 text-violet-700 border-violet-100'
            }`}>
            {depth === 0 ? 'عقد أصلي' : `عقد استكمالي (مستوى ${ depth })`}
          </span>
        </div>

        {contract.description && (
          <div className="mb-4 bg-gray-50/50 border border-gray-100 p-3 rounded-xl">
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
              {contract.description}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white/70 p-3 rounded-xl border border-gray-100/80 flex flex-col justify-between">
            <span className="text-gray-400 block mb-1 text-[10px]">قيمة العقد</span>
            <span className="font-bold text-gray-800">{renderMultiCurrency(contract.values, contract.contractValue)}</span>
          </div>
          <div className="bg-white/70 p-3 rounded-xl border border-gray-150 flex flex-col justify-between">
            <span className="text-gray-400 block mb-1 text-[10px]">المبلغ المدفوع</span>
            <span className="font-bold text-green-600">{renderMultiCurrency(contract.paidAmounts, contract.paidAmount)}</span>
          </div>
          <div className="bg-white/70 p-3 rounded-xl border border-gray-150 col-span-2 sm:col-span-1 flex flex-col justify-between">
            <span className="text-gray-400 block mb-1 text-[10px]">المتبقي</span>
            <span className="font-bold text-primary">{renderMultiCurrencyRemaining(contract.values, contract.paidAmounts, contract.remainingAmount)}</span>
          </div>
        </div>

        {contract.images?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100/80 flex flex-wrap gap-2 items-center">
            <span className="text-[10px] text-gray-400 font-medium ml-2">المرفقات:</span>
            <div className="flex flex-wrap gap-2">
              {contract.images.map((img, idx) => {
                const isPdf = img?.toLowerCase().endsWith('.pdf')
                return (
                  <div key={idx}
                    className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 cursor-pointer hover:border-indigo-500 transition-colors shadow-sm flex items-center justify-center"
                    onClick={() => isPdf ? window.open(getImageUrl(img), '_blank') : setSelectedImage({ url: img, title: 'وثيقة عقد رسمية' })}
                  >
                    {isPdf ? (
                      <div className="flex flex-col items-center justify-center w-full h-full bg-red-50 text-red-600">
                        <FileText size={16} />
                        <span className="text-[8px] font-bold">PDF</span>
                      </div>
                    ) : (
                      <img src={getImageUrl(img)} className="w-full h-full object-cover" alt="Contract document" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {children.length > 0 && (
        <div className="flex flex-col gap-4">
          {children.map(child => (
            <ContractNode
              key={child._id}
              contract={child}
              allContracts={allContracts}
              depth={depth + 1}
              setSelectedImage={setSelectedImage}
              getImageUrl={getImageUrl}
              fmt={fmt}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const TABS = ['نظرة عامة', 'المالية', 'التقييم والمخاطر']

export default function ProjectDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAdmin } = useAuth()
  const [project, setProject] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)
  const [selectedImage, setSelectedImage] = useState(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [contractsView, setContractsView] = useState('tree')
  const [currencyTab, setCurrencyTab] = useState('ALL')

  const refreshData = async () => {
    try {
      const [projData, expData] = await Promise.all([
        fetchProjectById(id),
        fetchProjectExpenses(id)
      ])
      setProject(projData)
      setExpenses(expData.expenses || [])
    } catch (err) {
      console.error(err)
      toast.error('خطأ في تحديث البيانات')
    }
  }

  useEffect(() => {
    const getData = async () => {
      setLoading(true)
      await refreshData()
      setLoading(false)
    }
    getData()
  }, [id])

  useEffect(() => {
    if (!project) return
    const currencyParam = searchParams.get('currency')
    const tabParam = searchParams.get('tab')
    if (currencyParam) {
      const normalized = normalizeCurrencyCode(currencyParam)
      const allCurrencies = getAllProjectCurrencies(project.budgets, project.funding, expenses, project.totalBudget)
      if (allCurrencies.includes(normalized)) setCurrencyTab(normalized)
    }
    if (tabParam !== null && !Number.isNaN(Number(tabParam))) setTab(Number(tabParam))
  }, [project, expenses, searchParams])

  const handleDownloadReport = () => {
    window.open(`/projects/${id}/report`, '_blank')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-sm text-gray-400">جاري تحميل بيانات المشروع...</p>
      </div>
    </div>
  )
  if (!project) return (
    <div className="card text-center py-16">
      <p className="text-gray-500 mb-4">المشروع غير موجود أو تم حذفه</p>
      <button onClick={() => navigate('/projects')} className="btn-primary">العودة للمشروعات</button>
    </div>
  )

  const coords = project.location?.coordinates || [31.23, 30.04]
  const lng = coords[0]
  const lat = coords[1]

  const projectBudgets = normalizeBudgets(project?.budgets, project?.totalBudget);
  const budgetCurrencies = project ? getProjectCurrencies(projectBudgets) : ['EGP'];
  const allCurrencies = project
    ? getAllProjectCurrencies(project.budgets, project.funding, expenses, project.totalBudget)
    : ['EGP'];
  const fundingOnlyCurrencies = allCurrencies.filter(c => !budgetCurrencies.includes(c));
  const isActiveFundingOnly = currencyTab !== 'ALL' && fundingOnlyCurrencies.includes(currencyTab);

  // Filtering by currency
  const filteredExpenses = expenses.filter(e => currencyTab === 'ALL' || normalizeCurrencyCode(e.currency) === currencyTab);
  const filteredFunding = project?.funding?.filter(f => currencyTab === 'ALL' || normalizeCurrencyCode(f.currency) === currencyTab) || [];

  const expenseCategories = filteredExpenses.reduce((acc, exp) => {
    const existing = acc.find(c => c.category === exp.category)
    if (existing) {
      existing.amount += exp.amount
    } else {
      acc.push({ category: exp.category, amount: exp.amount })
    }
    return acc
  }, [])

  const currentBudget = currencyTab === 'ALL'
    ? budgetCurrencies.reduce((sum, c) => sum + (projectBudgets[c] || 0), 0)
    : (projectBudgets[currencyTab] || 0);
  const currentCommitted = filteredFunding.reduce((sum, f) => sum + (f.committedAmount || 0), 0);
  const currentReceived = filteredFunding.reduce((sum, f) => sum + (f.receivedAmount || 0), 0);
  const currentSpent = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const currentBudgetCurrency = isActiveFundingOnly
    ? currencyTab
    : currencyTab === 'ALL' && budgetCurrencies.length !== 1
      ? null
      : (currencyTab === 'ALL' ? budgetCurrencies[0] : currencyTab);
  const financialProgress = currentBudget > 0 ? Math.round((currentSpent / currentBudget) * 100) : 0;
  const formatCurrentValue = (value) => currentBudgetCurrency
    ? formatCurrencyVal(value, currentBudgetCurrency)
    : `${ Number(value || 0).toLocaleString('ar-EG') } (${ budgetCurrencies.length } عملات)`;
  const formatBudgetKpi = () => {
    if (isActiveFundingOnly) return 'غير محددة في الميزانية';
    return formatCurrentValue(currentBudget);
  };

  return (
    <div className="section-gap">
      {/* Back + Header */}
      <div>
        <button onClick={() => navigate(-1)}
          className="btn-ghost text-gray-500 mb-4 -mr-1 flex items-center gap-2 text-sm">
          <ArrowRight size={16} /> العودة لقائمة المشروعات
        </button>
        <div className="page-header flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="badge badge-info text-[10px] uppercase font-bold">{project.sectorId?.name}</span>
              <StatusBadge status={project.status} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">{project.title}</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadReport}
              className="btn-primary text-xs px-6 flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <FileText size={14} />
              تقرير شامل للطباعة
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100/50 p-1 rounded-xl w-fit border border-gray-200">
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            className={`px-6 py-2 text-sm rounded-lg transition-all
              ${ tab === i ? 'bg-white text-primary shadow-sm font-bold' : 'text-gray-500 hover:text-gray-800' }`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 border-b border-gray-100">
        <button onClick={() => setCurrencyTab('ALL')} className={`px-4 py-2 text-sm rounded-lg transition-all ${ currencyTab === 'ALL' ? 'bg-primary text-white font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200' }`}>
          كل العملات
        </button>
        {budgetCurrencies.map(c => (
          <button key={c} onClick={() => setCurrencyTab(c)} className={`px-4 py-2 text-sm rounded-lg transition-all whitespace-nowrap ${ currencyTab === c ? 'bg-primary text-white font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200' }`}>
            {getCurrencyLabel(c)}
          </button>
        ))}
        {fundingOnlyCurrencies.map(c => (
          <button
            key={c}
            onClick={() => { setCurrencyTab(c); setTab(1) }}
            className={`px-4 py-2 text-sm rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${ currencyTab === c ? 'bg-amber-500 text-white font-bold' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200' }`}
          >
            {getCurrencyLabel(c)}
            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${ currencyTab === c ? 'bg-white/20' : 'bg-amber-200/60' }`}>تمويل</span>
          </button>
        ))}
      </div>

      {/* Tab 0: Overview */}
      {tab === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="font-bold text-gray-800">بيانات المشروع الأساسية</h3>
              <span className="text-[10px] text-gray-400 font-mono">ID: {project._id}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              {[
                { icon: Building2, l: 'الجهة المستفيدة', v: project.companyId?.name_ar || project.companyId?.name },
                { icon: Building2, l: 'ا  لجهة المنفذة', v: project.beneficiaryEntity || 'غير محدد' },
                { icon: Calendar, l: 'موعد أو تاريخ المشروع', v: project.projectDate || (project.startDate ? new Date(project.startDate).toLocaleDateString('ar-EG') : 'غير محدد') },
                { icon: MapPin, l: 'موقع المشروع', v: project.projectLocation || 'غير محدد' },
              ].map(({ icon: Icon, l, v }) => (
                <div key={l} className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Icon size={18} className="text-primary flex-shrink-0" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] font-bold mb-0.5">{l}</p>
                    <p className="font-semibold text-gray-700 text-sm">{v}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
              <h4 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <Info size={14} className="text-primary" /> وصف وأهداف المشروع
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{project.description}</p>
            </div>

            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
              <h4 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <TrendingUp size={14} className="text-primary" /> تفاصيل التنفيذ والعمل الجاري
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {project.executionDetails || 'لا توجد تفاصيل تنفيذ مسجلة حالياً.'}
              </p>
            </div>
          </div>

          <div className="card space-y-6">
            <h3 className="font-bold text-gray-800 border-b pb-4">مؤشرات الإنجاز</h3>
            <div className="flex flex-col items-center gap-8 py-4">
              <CircularProgress
                value={project.completionPercentage || 0}
                label="النسبة التقديرية"
                color="#1E3A5F"
              />
              <div className="w-full space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">حالة التنفيذ</span>
                    <span className="font-bold">{project.status}</span>
                  </div>
                  <ProgressBar
                    value={project.completionPercentage || 0}
                    color={project.status === 'متأخر' ? 'bg-red-500' : 'bg-primary'}
                  />
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Financial */}
      {tab === 1 && (
        <div className="section-gap">
          {isActiveFundingOnly && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900 leading-relaxed">
                تبويب <strong>{getCurrencyLabel(currencyTab)}</strong> مخصص لتمويل بعملة غير مدرجة في ميزانية المشروع.
                يعرض مصادر التمويل والدفعات المالية لهذه العملة فقط.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { l: 'الميزانية التخطيطية للمشروع', v: formatBudgetKpi(), color: 'text-blue-900', bg: 'bg-blue-50/50', icon: DollarSign },
              { l: 'إجمالي التمويل المعتمد', v: formatCurrentValue(currentCommitted), color: 'text-primary', bg: 'bg-white', icon: Wallet },
              { l: 'إجمالي المبالغ المستلمة', v: formatCurrentValue(currentReceived), color: 'text-green-600', bg: 'bg-white', icon: ArrowDownToLine },
              { l: 'إجمالي المنصرف الفعلي', v: formatCurrentValue(currentSpent), color: 'text-orange-600', bg: 'bg-white', icon: CreditCard },
            ].map(({ l, v, color, bg, icon: Icon }) => (
              <div key={l} className={`card ${ bg } border-gray-100 flex flex-col items-center justify-center py-6 group hover:shadow-md transition-shadow`}>
                <div className="p-2 bg-gray-50 rounded-full mb-3 group-hover:bg-white transition-colors">
                  <Icon size={16} className={color} />
                </div>
                <p className="text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-tight">{l}</p>
                <p className={`text-xl font-black ${ color }`}>{v}</p>
              </div>
            ))}
          </div>

          {/* Funding Sources Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card lg:col-span-2">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Banknote size={18} className="text-primary" /> تحليل مصادر التمويل (المعتمد vs المستلم)
              </h3>
              {filteredFunding.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredFunding} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                      <XAxis dataKey="sourceName" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={v => fmt(v)} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(v, name, props) => [formatCurrencyVal(v, props.payload.currency), name === 'committedAmount' ? 'المعتمد' : 'المستلم']}
                      />
                      <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }} />
                      <Bar dataKey="committedAmount" name="المبلغ المعتمد" fill="#1E3A5F" radius={[4, 4, 0, 0]} barSize={30} />
                      <Bar dataKey="receivedAmount" name="المبلغ المستلم" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
                  <Banknote size={40} className="opacity-10" />
                  <p className="text-sm">لا توجد بيانات تمويل مسجلة</p>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" /> توزيع المصروفات الفعلية
              </h3>
              {isActiveFundingOnly ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
                  <DollarSign size={40} className="opacity-10" />
                  <p className="text-sm">لا توجد ميزانية أو مصروفات بهذه العملة</p>
                </div>
              ) : expenseCategories.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseCategories} dataKey="amount" nameKey="category"
                        cx="50%" cy="50%" outerRadius={80} innerRadius={55} paddingAngle={5}>
                        {expenseCategories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [fmt(v), 'القيمة']} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
                  <DollarSign size={40} className="opacity-10" />
                  <p className="text-sm">لا توجد سجلات مصروفات</p>
                </div>
              )}
            </div>
          </div>

          {/* Funding Sources List & Transactions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <History size={18} className="text-primary" /> تفاصيل جهات التمويل والدفعات
              </h3>
            </div>

            {filteredFunding.map((f) => (
              <div key={f._id} className="card p-0 overflow-hidden border-gray-100">
                <div className="bg-gray-50/50 p-5 border-b flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                      <Building2 size={24} className="text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-bold text-gray-900">{f.sourceName}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-bold">{f.sourceType}</span>
                      </div>
                      <p className="text-xs text-gray-500">{f.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-6 items-center">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase">المبلغ المعتمد</p>
                      <p className="text-sm font-bold text-gray-800">{formatCurrencyVal(f.committedAmount, f.currency)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase">المستلم</p>
                      <p className="text-sm font-bold text-green-600">{formatCurrencyVal(f.receivedAmount, f.currency)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase">المتبقي</p>
                      <p className="text-sm font-bold text-primary">{formatCurrencyVal(f.remainingAmount, f.currency)}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100">
                      <div className={`w-2 h-2 rounded-full ${ f.status === 'تم استلام بالكامل' ? 'bg-green-500' : 'bg-orange-500' }`} />
                      <span className="text-[11px] font-bold text-gray-700">{f.status}</span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead className="bg-white">
                      <tr>
                        <th className="text-[10px]">تاريخ الدفعة</th>
                        <th className="text-[10px]">رقم المرجع</th>
                        <th className="text-[10px]">ملاحظات</th>
                        <th className="text-[10px] text-left">القيمة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {f.transactions?.map((t) => (
                        <tr key={t._id} className="text-[11px] hover:bg-gray-50/50">
                          <td className="text-gray-500">{new Date(t.transactionDate).toLocaleDateString('ar-EG')}</td>
                          <td className="font-mono text-gray-400">{t.referenceNumber}</td>
                          <td className="text-gray-600 italic">{t.notes || '---'}</td>
                          <td className="font-bold text-primary text-left">{formatCurrencyVal(t.amount, f.currency)}</td>
                        </tr>
                      ))}
                      {(!f.transactions || f.transactions.length === 0) && (
                        <tr><td colSpan="4" className="py-8 text-center text-gray-400 italic">لا توجد دفعات مسجلة بعد</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {currencyTab === 'ALL' && (
            <div className="card p-0 overflow-hidden mb-6">
              <h3 className="font-bold text-gray-800 p-5 border-b bg-gray-50/50">مقارنة الميزانيات (كل العملات)</h3>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead><tr>
                    <th>العملة</th><th>الميزانية</th><th>المنصرف</th><th>المتبقي</th>
                  </tr></thead>
                  <tbody>
                    {allCurrencies.map((c) => {
                      const fundingOnly = isFundingOnlyCurrency(c, project.budgets, project.totalBudget);
                      const b = projectBudgets[c] || 0;
                      const s = expenses
                        .filter(e => normalizeCurrencyCode(e.currency) === c)
                        .reduce((sum, e) => sum + e.amount, 0);
                      const committed = (project.funding || [])
                        .filter(f => normalizeCurrencyCode(f.currency) === c)
                        .reduce((sum, f) => sum + (f.committedAmount || 0), 0);
                      const received = (project.funding || [])
                        .filter(f => normalizeCurrencyCode(f.currency) === c)
                        .reduce((sum, f) => sum + (f.receivedAmount || 0), 0);
                      const rem = b - s;
                      return (
                        <tr key={c} className={`text-xs ${ fundingOnly ? 'bg-amber-50/40' : '' }`}>
                          <td className="font-bold text-gray-700">
                            {getCurrencyLabel(c)}
                            {fundingOnly && (
                              <span className="mr-2 text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">تمويل فقط</span>
                            )}
                          </td>
                          <td className="font-mono text-blue-900">
                            {fundingOnly ? '—' : formatCurrencyVal(b, c)}
                          </td>
                          <td className="font-mono text-orange-600">
                            {fundingOnly ? formatCurrencyVal(received, c) : formatCurrencyVal(s, c)}
                          </td>
                          <td className={`font-mono ${ fundingOnly ? 'text-amber-700' : rem < 0 ? 'text-red-500' : 'text-green-500' }`}>
                            {fundingOnly ? formatCurrencyVal(committed - received, c) : formatCurrencyVal(rem, c)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detailed Expenses Table */}
          <div className="card p-0 overflow-hidden mb-6">
            <h3 className="font-bold text-gray-800 p-5 border-b bg-gray-50/50 flex items-center justify-between">
              <span>سجل المصروفات التفصيلي</span>
              <span className="text-[10px] text-gray-400 font-normal">إجمالي المعاملات: {filteredExpenses.length}</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr>
                  <th>التاريخ</th><th>العملة</th><th>الفئة</th><th>البيان</th><th>المورد</th><th>القيمة</th><th>الحالة</th>
                </tr></thead>
                <tbody>
                  {filteredExpenses.map((exp, i) => (
                    <tr key={exp._id} className="text-[11px]">
                      <td className="text-gray-400">{new Date(exp.date).toLocaleDateString('ar-EG')}</td>
                      <td className="font-bold text-gray-600">{exp.currency}</td>
                      <td><span className="badge badge-outline text-[10px]">{exp.category}</span></td>
                      <td className="font-bold text-gray-700">{exp.description}</td>
                      <td className="text-gray-500">{exp.vendor}</td>
                      <td className="font-bold text-blue-900">{formatCurrencyVal(exp.amount, exp.currency)}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${ exp.status === 'معتمد' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                          {exp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr><td colSpan="7" className="py-12 text-center text-gray-400 italic">لا توجد سجلات مصروفات لهذا المشروع</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Contracts Section */}
          {project.contracts?.length > 0 && (
            <div className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100" dir="rtl">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-primary" /> العقود المرتبطة بالمشروع
                </h3>
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => setContractsView('tree')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${ contractsView === 'tree' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <GitBranch size={14} />
                    <span>عرض شجري</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setContractsView('grid')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${ contractsView === 'grid' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <LayoutGrid size={14} />
                    <span>عرض كروت</span>
                  </button>
                </div>
              </div>

              {contractsView === 'tree' ? (
                <div className="space-y-6">
                  {project.contracts
                    .filter(c => !c.parentContractId || !project.contracts.some(pc => pc._id === c.parentContractId))
                    .map(rootContract => (
                      <ContractNode
                        key={rootContract._id}
                        contract={rootContract}
                        allContracts={project.contracts}
                        setSelectedImage={setSelectedImage}
                        getImageUrl={getImageUrl}
                        fmt={fmt}
                      />
                    ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" dir="rtl">
                  {project.contracts.map((c, i) => (
                    <div key={i} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/30 hover:border-primary/20 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-white rounded-lg border border-gray-100">
                          <Building2 size={20} className="text-primary" />
                        </div>
                        <span className="badge badge-success text-[10px]">نشط</span>
                      </div>
                      <h4 className="font-bold text-gray-800 mb-1">{c.contractorName}</h4>
                      <p className="text-[10px] text-gray-400 mb-4 font-mono">{c._id}</p>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs items-start">
                          <span className="text-gray-500 mt-1">قيمة العقد</span>
                          <span className="font-bold">{renderMultiCurrency(c.values, c.contractValue)}</span>
                        </div>
                        <div className="flex justify-between text-xs items-start">
                          <span className="text-gray-500 mt-1">المبلغ المدفوع</span>
                          <span className="font-bold text-green-600">{renderMultiCurrency(c.paidAmounts, c.paidAmount)}</span>
                        </div>
                        <div className="flex justify-between text-xs pt-2 border-t items-start">
                          <span className="text-gray-500 mt-1">المتبقي</span>
                          <span className="font-bold text-primary">{renderMultiCurrencyRemaining(c.values, c.paidAmounts, c.remainingAmount)}</span>
                        </div>
                        {c.description && (
                          <div className="mt-2 bg-white/50 p-2 rounded-lg border border-gray-100/50">
                            <p className="text-[11px] text-gray-500 leading-relaxed max-h-12 overflow-y-auto whitespace-pre-line">
                              {c.description}
                            </p>
                          </div>
                        )}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {c.images?.map((img, idx) => {
                            const isPdf = img?.toLowerCase().endsWith('.pdf')
                            return (
                              <div key={idx}
                                className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden border border-gray-200 cursor-pointer hover:border-primary transition-colors flex items-center justify-center"
                                onClick={() => isPdf ? window.open(getImageUrl(img), '_blank') : setSelectedImage({ url: img, title: 'وثيقة عقد رسمية' })}
                              >
                                {isPdf ? (
                                  <div className="flex flex-col items-center justify-center w-full h-full bg-red-50 text-red-600">
                                    <FileText size={16} />
                                    <span className="text-[8px] font-bold">PDF</span>
                                  </div>
                                ) : (
                                  <img src={getImageUrl(img)} className="w-full h-full object-cover" alt="Contract" />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Risks & Assessment */}
      {tab === 2 && (
        <div className="section-gap">
          {/* Risks Header Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-400/20">
                <AlertTriangle size={28} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">سجل المخاطر والتحديات</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  {project.risks?.length > 0
                    ? `${ project.risks.length } خطر مُسجَّل — مراقبة نشطة للمشروع`
                    : 'لا توجد مخاطر مُسجَّلة لهذا المشروع'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {['عالي', 'متوسط', 'منخفض'].map(sev => {
                const count = project.risks?.filter(r => r.severity === sev).length || 0
                const colors = {
                  'عالي': 'bg-red-500/20 text-red-300 border-red-500/30',
                  'متوسط': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
                  'منخفض': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                }
                return (
                  <div key={sev} className={`px-4 py-2 rounded-xl border text-center min-w-[70px] ${ colors[sev] }`}>
                    <p className="text-xl font-black">{count}</p>
                    <p className="text-[10px] font-bold opacity-80">{sev}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Risks Grid or Empty State */}
          {project.risks?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.risks.map((r, i) => (
                <div key={i} className={`relative overflow-hidden rounded-2xl border p-5 space-y-4 transition-all hover:shadow-md
                  ${ r.severity === 'عالي'
                    ? 'border-red-200 bg-red-50/40'
                    : r.severity === 'متوسط'
                      ? 'border-orange-200 bg-orange-50/40'
                      : 'border-blue-200 bg-blue-50/40' }`}
                >
                  {/* Severity stripe */}
                  <div className={`absolute top-0 right-0 w-1.5 h-full rounded-r-2xl
                    ${ r.severity === 'عالي' ? 'bg-red-400' : r.severity === 'متوسط' ? 'bg-orange-400' : 'bg-blue-400' }`} />

                  <div className="flex items-center justify-between pr-3">
                    <span className={`text-[11px] px-3 py-1 rounded-full font-bold
                      ${ r.severity === 'عالي' ? 'bg-red-100 text-red-700' :
                        r.severity === 'متوسط' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700' }`}>
                      ⚠ تأثير {r.severity}
                    </span>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600 font-bold shadow-sm">
                      {r.status || 'نشط'}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-gray-800 pr-3 leading-relaxed">{r.description}</p>

                  {r.mitigationPlan && (
                    <div className="flex items-start gap-3 bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-white shadow-sm pr-3">
                      <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                        <ShieldCheck size={14} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-wide">خطة التخفيف</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{r.mitigationPlan}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Premium Empty State */
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-center gap-5 shadow-sm">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center border-4 border-green-100 shadow-inner">
                  <ShieldCheck size={40} className="text-green-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-xs font-black">✓</span>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-1">لا توجد مخاطر مُسجَّلة</h4>
                <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
                  هذا المشروع لا يحتوي على أي مخاطر موثقة حالياً. يمكن إضافة المخاطر عند تسجيل المشروع أو تحديثه.
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-100">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-bold text-green-700">الوضع مستقر — لا تهديدات نشطة</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attachment View Modal (Image / PDF) */}
      {selectedImage && (() => {
        const fileUrl = getImageUrl(selectedImage.url || selectedImage)
        const isPdf = (selectedImage.url || selectedImage)?.toLowerCase().endsWith('.pdf')
        
        return (
          <div
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="absolute -top-12 right-0 left-0 flex items-center justify-between px-2">
                <button
                  className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all"
                  onClick={() => setSelectedImage(null)}
                >
                  <X size={24} />
                </button>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl px-4 py-2 transition-all text-xs font-bold flex items-center gap-1.5"
                >
                  <ExternalLink size={14} />
                  <span>فتح في علامة تبويب جديدة</span>
                </a>
              </div>
              {isPdf ? (
                <iframe
                  src={fileUrl}
                  className="w-full h-[75vh] rounded-xl border-0 bg-white shadow-2xl"
                  title={selectedImage.title || 'وثيقة عقد PDF'}
                />
              ) : (
                <img
                  src={fileUrl}
                  className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
                  alt={selectedImage.title || 'صورة'}
                />
              )}
              {selectedImage.title && (
                <p className="text-white mt-4 font-bold text-lg bg-black/50 px-6 py-2 rounded-full">{selectedImage.title}</p>
              )}
            </div>
          </div>
        )
      })()}

    </div>
  )
}
