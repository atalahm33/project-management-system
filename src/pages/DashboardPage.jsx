import { useEffect, useState } from 'react'
import {
  FolderKanban, CheckCircle2, Clock, AlertTriangle,
  Wallet, TrendingUp, PiggyBank, BarChart3,
  ChevronLeft, ChevronRight, Calendar, Filter,
  Download, RefreshCw, Eye, MoreVertical, Maximize2, Minimize2
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend, LineChart,
  Line, AreaChart, Area, CartesianGrid
} from 'recharts'
import KpiCard from '../components/KpiCard'
import { fetchDashboardStats, fetchBudgetAnalytics, fetchAvailableCurrencies } from '../api/financeApi'
import { getCurrencyLabel, formatCurrencyCompact } from '../api/currencyUtils'

const COLORS = ['#1E3A5F', '#2D6A4F', '#B5460F', '#5A189A', '#0077B6', '#C77DFF', '#386641', '#F39C12', '#E74C3C', '#3498DB']

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [currencyTab, setCurrencyTab] = useState('ALL')
  const [availableCurrencies, setAvailableCurrencies] = useState([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedChart, setExpandedChart] = useState(null)
  const [chartViewMode, setChartViewMode] = useState('grid') // grid, list, compact

  useEffect(() => {
    fetchAvailableCurrencies().then(res => setAvailableCurrencies(res || []))
  }, [])

  useEffect(() => {
    setStats(null)
    setAnalytics(null)
    Promise.all([
      fetchDashboardStats(currencyTab),
      fetchBudgetAnalytics(currencyTab)
    ]).then(([statsData, analyticsData]) => {
      setStats(statsData)
      setAnalytics(analyticsData)
    })
  }, [currencyTab])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([
      fetchDashboardStats(currencyTab),
      fetchBudgetAnalytics(currencyTab)
    ]).then(([statsData, analyticsData]) => {
      setStats(statsData)
      setAnalytics(analyticsData)
    })
    setIsRefreshing(false)
  }

  const handleCurrencyChange = (c) => setCurrencyTab(c)

  if (!stats) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  )

  const { projectsStatus, budgetSummary, sectorDistribution } = stats
  const currentCurrency = currencyTab === 'ALL' ? 'EGP' : currencyTab
  const fmt = (n) => formatCurrencyCompact(n, currentCurrency)

  // تحضير البيانات للحالات المختلفة
  const statusData = [
    { name: 'مخطط له', value: projectsStatus.planned?.count || 0, color: '#3498DB', percentage: projectsStatus.planned?.percentage || 0 },
    { name: 'قيد التنفيذ', value: projectsStatus.onTrack?.count || 0, color: '#F39C12', percentage: projectsStatus.onTrack?.percentage || 0 },
    { name: 'مكتمل', value: projectsStatus.completed?.count || 0, color: '#2ECC71', percentage: projectsStatus.completed?.percentage || 0 },
    { name: 'متوقف', value: projectsStatus.suspended?.count || 0, color: '#95A5A6', percentage: projectsStatus.suspended?.percentage || 0 },
    { name: 'متأخر', value: projectsStatus.delayed?.count || 0, color: '#E74C3C', percentage: projectsStatus.delayed?.percentage || 0 }
  ].filter(item => item.value > 0) // عرض الحالات الموجودة فقط

  const KPIS = [
    { 
      icon: FolderKanban, 
      label: 'إجمالي المشروعات', 
      value: stats.totalProjects, 
      color: '#1E3A5F', 
      trend: `+${projectsStatus.onTrack.count + projectsStatus.completed.count} نشط`, 
      trendUp: true,
      subtitle: `منها ${projectsStatus.completed.count} منتهي`
    },
    { 
      icon: Clock, 
      label: 'قيد التنفيذ', 
      value: projectsStatus.onTrack.count, 
      color: '#F39C12', 
      trend: `${projectsStatus.onTrack.percentage}%`, 
      trendUp: true,
      subtitle: `من إجمالي ${stats.totalProjects} مشروع`
    },
    { 
      icon: CheckCircle2, 
      label: 'المشروعات المنتهية', 
      value: projectsStatus.completed.count, 
      color: '#2ECC71', 
      trend: `${projectsStatus.completed.percentage}%`, 
      trendUp: true,
      subtitle: `نسبة الإنجاز الكلي`
    },
    { 
      icon: AlertTriangle, 
      label: 'متأخر / متوقف', 
      value: (projectsStatus.delayed?.count || 0) + (projectsStatus.suspended?.count || 0), 
      color: '#E74C3C', 
      trend: `${(projectsStatus.delayed?.percentage || 0) + (projectsStatus.suspended?.percentage || 0)}%`,
      trendUp: false,
      subtitle: `يحتاج إلى متابعة`
    },
    { 
      icon: Wallet, 
      label: 'إجمالي الميزانية', 
      value: fmt(budgetSummary.totalBudget), 
      color: '#1E3A5F',
      subtitle: `موزعة على ${sectorDistribution.length} قطاع`
    },
    { 
      icon: TrendingUp, 
      label: 'إجمالي المنصرف', 
      value: fmt(budgetSummary.totalSpent), 
      color: '#5A189A',
      subtitle: `${budgetSummary.spentPercentage}% من الإجمالي`
    },
    { 
      icon: PiggyBank, 
      label: 'الميزانية المتبقية', 
      value: fmt(budgetSummary.remainingBudget), 
      color: '#2D6A4F',
      subtitle: `${budgetSummary.remainingPercentage}% متبقي`
    },
    { 
      icon: BarChart3, 
      label: 'متوسط الإنفاق لكل مشروع', 
      value: fmt(budgetSummary.totalBudget / stats.totalProjects), 
      color: '#0077B6',
      subtitle: `لكل مشروع`
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white shadow-md backdrop-blur-sm bg-white/95">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">لوحة التحكم الرئيسية</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {sectorDistribution.length} قطاع | {stats.totalProjects} مشروع | {budgetSummary.spentPercentage}% منفق
              </p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleRefresh}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => setChartViewMode(mode => mode === 'grid' ? 'compact' : mode === 'compact' ? 'list' : 'grid')}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all hidden sm:block"
                title={`تغيير العرض: ${chartViewMode === 'grid' ? 'شبكة' : chartViewMode === 'compact' ? 'مضغوط' : 'قائمة'}`}
              >
                <Maximize2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Currency Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 sm:mb-6 border-b border-gray-200 scrollbar-thin sticky top-[73px] bg-gray-50 z-10">
          <button 
            onClick={() => handleCurrencyChange('ALL')} 
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-all whitespace-nowrap ${
              currencyTab === 'ALL' 
                ? 'bg-primary text-white font-bold shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            المقارنة الشاملة (كل العملات)
          </button>
          {availableCurrencies.map(c => (
            <button 
              key={c} 
              onClick={() => handleCurrencyChange(c)} 
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-all whitespace-nowrap ${
                currencyTab === c 
                  ? 'bg-primary text-white font-bold shadow-md' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {getCurrencyLabel(c)}
            </button>
          ))}
        </div>

        {/* KPIs - Responsive Grid */}
        <div className={`grid gap-3 sm:gap-4 mb-4 sm:mb-6 ${
          chartViewMode === 'compact' 
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8' 
            : 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}>
          {KPIS.map((k, i) => (
            <KpiCard key={i} {...k} delay={i * 50} />
          ))}
        </div>

        {/* Sector Distribution & Budget Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mb-4 sm:mb-6">
          {/* Sectors Pie Chart */}
          <div className="card bg-white rounded-xl shadow-lg p-3 sm:p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-bold text-gray-700 text-base sm:text-lg">توزيع المشروعات حسب القطاع</h3>
              <span className="text-xs text-gray-400">{sectorDistribution.length} قطاع</span>
            </div>
            <div className="h-[220px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={sectorDistribution} 
                    dataKey="count" 
                    nameKey="sectorName"
                    cx="50%" 
                    cy="50%" 
                    outerRadius="70%" 
                    innerRadius="35%"
                    labelLine={false}
                    label={({ name, percent }) => window.innerWidth > 768 ? `${name.substring(0, 10)}: ${(percent * 100).toFixed(0)}%` : ''}
                  >
                    {sectorDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} مشروع (${((value / stats.totalProjects) * 100).toFixed(1)}%)`, name]} />
                  <Legend 
                    wrapperStyle={{ fontSize: window.innerWidth > 768 ? '11px' : '9px', maxHeight: '80px', overflowY: 'auto' }}
                    formatter={(value) => <span className="text-xs">{value.length > 15 ? value.substring(0, 12) + '...' : value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* تفاصيل إضافية */}
            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
              <div className="text-center">
                <span className="text-gray-400">أكبر قطاع</span>
                <p className="font-bold text-primary">
                  {sectorDistribution.reduce((max, item) => item.count > max.count ? item : max, sectorDistribution[0])?.sectorName}
                </p>
              </div>
              <div className="text-center">
                <span className="text-gray-400">متوسط المشاريع</span>
                <p className="font-bold text-primary">{(stats.totalProjects / sectorDistribution.length).toFixed(1)}</p>
              </div>
            </div>
          </div>

          {/* Budget vs Spending Bar Chart */}
          <div className="card bg-white rounded-xl shadow-lg p-3 sm:p-5 lg:col-span-2 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-bold text-gray-700 text-base sm:text-lg">الميزانية مقابل المصروفات حسب القطاع</h3>
              <span className="text-xs text-gray-400">العملة: {getCurrencyLabel(currentCurrency)}</span>
            </div>
            <div className="h-[220px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorDistribution} barGap={4} layout={window.innerWidth > 768 ? "vertical" : "horizontal"}>
                  {window.innerWidth > 768 ? (
                    <>
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                      <YAxis 
                        dataKey="sectorName" 
                        type="category" 
                        width={100} 
                        tick={{ fontSize: 10, fontFamily: 'Cairo' }}
                        tickFormatter={v => v.length > 12 ? v.substring(0, 10) + '...' : v}
                      />
                    </>
                  ) : (
                    <>
                      <XAxis 
                        dataKey="sectorName" 
                        tick={{ fontSize: 8, fontFamily: 'Cairo' }} 
                        angle={-45} 
                        textAnchor="end" 
                        height={60}
                        tickFormatter={v => v.length > 8 ? v.substring(0, 6) + '..' : v}
                      />
                      <YAxis tick={{ fontSize: 9 }} tickFormatter={v => fmt(v)} width={50} />
                    </>
                  )}
                  <Tooltip formatter={(v, n) => [fmt(v), n === 'totalBudget' ? 'الميزانية' : 'المصروف']} />
                  <Legend formatter={v => v === 'totalBudget' ? 'الميزانية' : 'المصروف'} />
                  <Bar dataKey="totalBudget" name="totalBudget" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="totalSpent" name="totalSpent" fill="#F39C12" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* إحصائيات سريعة */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs">
              <div>
                <span className="text-gray-400">أعلى ميزانية:</span>
                <span className="font-bold mr-1">{fmt(Math.max(...sectorDistribution.map(s => s.totalBudget)))}</span>
              </div>
              <div>
                <span className="text-gray-400">أعلى مصروفات:</span>
                <span className="font-bold mr-1">{fmt(Math.max(...sectorDistribution.map(s => s.totalSpent)))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Status & Sector Budget Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mb-4 sm:mb-6">
          {/* Project Status Distribution */}
          <div className="card bg-white rounded-xl shadow-lg p-3 sm:p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-bold text-gray-700 text-base sm:text-lg">حالات المشروعات</h3>
              <span className="text-xs text-gray-400">إجمالي {stats.totalProjects}</span>
            </div>
            <div className="h-[200px] sm:h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={statusData} 
                    dataKey="value" 
                    nameKey="name"
                    cx="50%" 
                    cy="50%" 
                    outerRadius="70%" 
                    innerRadius="40%"
                    label={({ name, percent }) => window.innerWidth > 768 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                  >
                    {statusData.map((d, i) => <Cell key={i} fill={d.color} stroke="white" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} مشروع (${props.payload.percentage}%)`, name]} />
                  <Legend wrapperStyle={{ fontSize: window.innerWidth > 768 ? '11px' : '9px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* حالة المشاريع كأشرطة */}
            <div className="mt-3 space-y-2">
              {statusData.map((status, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                  <span className="flex-1">{status.name}</span>
                  <span className="font-bold">{status.value}</span>
                  <span className="text-gray-400 w-12 text-left">{status.percentage}%</span>
                  <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${status.percentage}%`, backgroundColor: status.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sector Budget Details - Table View for Large Data */}
          <div className="card bg-white rounded-xl shadow-lg p-3 sm:p-5 lg:col-span-2 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-bold text-gray-700 text-base sm:text-lg">تفاصيل الميزانيات حسب القطاع</h3>
              <span className="text-xs text-gray-400">{sectorDistribution.length} سجل</span>
            </div>
            <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 sm:px-3 py-2 text-right">القطاع</th>
                    <th className="px-2 sm:px-3 py-2 text-right">المشاريع</th>
                    <th className="px-2 sm:px-3 py-2 text-right">الميزانية</th>
                    <th className="px-2 sm:px-3 py-2 text-right">المصروف</th>
                    <th className="px-2 sm:px-3 py-2 text-right">المتبقي</th>
                    <th className="px-2 sm:px-3 py-2 text-right">% الإنفاق</th>
                  </tr>
                </thead>
                <tbody>
                  {sectorDistribution.map((sector, idx) => {
                    const spentPercent = (sector.totalSpent / sector.totalBudget) * 100
                    return (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-2 sm:px-3 py-2 font-medium">{sector.sectorName}</td>
                        <td className="px-2 sm:px-3 py-2 text-center">{sector.count}</td>
                        <td className="px-2 sm:px-3 py-2 text-primary-dark">{fmt(sector.totalBudget)}</td>
                        <td className="px-2 sm:px-3 py-2 text-warning">{fmt(sector.totalSpent)}</td>
                        <td className="px-2 sm:px-3 py-2 text-success">{fmt(sector.totalBudget - sector.totalSpent)}</td>
                        <td className="px-2 sm:px-3 py-2">
                          <div className="flex items-center gap-1">
                            <span className={`font-bold ${spentPercent > 70 ? 'text-danger' : spentPercent > 40 ? 'text-warning' : 'text-success'}`}>
                              {spentPercent.toFixed(1)}%
                            </span>
                            <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${spentPercent}%`, backgroundColor: spentPercent > 70 ? '#E74C3C' : spentPercent > 40 ? '#F39C12' : '#2ECC71' }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-gray-50 font-bold">
                  <tr>
                    <td className="px-2 sm:px-3 py-2">الإجمالي</td>
                    <td className="px-2 sm:px-3 py-2 text-center">{stats.totalProjects}</td>
                    <td className="px-2 sm:px-3 py-2">{fmt(budgetSummary.totalBudget)}</td>
                    <td className="px-2 sm:px-3 py-2">{fmt(budgetSummary.totalSpent)}</td>
                    <td className="px-2 sm:px-3 py-2">{fmt(budgetSummary.remainingBudget)}</td>
                    <td className="px-2 sm:px-3 py-2">{budgetSummary.spentPercentage}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Budget Analytics Section */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {/* Project Budget vs Spending - Stacked Bar */}
            <div className="card bg-white rounded-xl shadow-lg p-3 sm:p-5 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="font-bold text-gray-700 text-base sm:text-lg">
                  الميزانية والمصروف حسب المشروع
                </h3>
                <span className="text-xs text-gray-400">{analytics.projectBudgets?.length || 0} مشروع | {analytics.currency}</span>
              </div>
              <div className="h-[300px] sm:h-[350px] overflow-x-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={analytics.projectBudgets || []} 
                    layout={window.innerWidth > 768 ? "vertical" : "horizontal"}
                    barSize={window.innerWidth > 768 ? 20 : 14}
                  >
                    {window.innerWidth > 768 ? (
                      <>
                        <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                        <YAxis 
                          dataKey="projectName" 
                          type="category" 
                          width={120} 
                          tick={{ fontSize: 9, fontFamily: "Cairo" }}
                          tickFormatter={v => v.length > 15 ? v.substring(0, 12) + '...' : v}
                        />
                      </>
                    ) : (
                      <>
                        <XAxis 
                          dataKey="projectName" 
                          tick={{ fontSize: 8, fontFamily: "Cairo" }}
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          tickFormatter={v => v.length > 10 ? v.substring(0, 8) + '..' : v}
                        />
                        <YAxis tick={{ fontSize: 9 }} tickFormatter={v => fmt(v)} width={50} />
                      </>
                    )}
                    <Tooltip formatter={(value, name) => [fmt(value), name === "spent" ? "المصروف" : "المتبقي"]} />
                    <Legend formatter={(value) => value === "spent" ? "المصروف" : "المتبقي"} />
                    <Bar dataKey="spent" stackId="a" fill="#0F2138" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={(row) => row.budget - row.spent} name="remaining" stackId="a" fill="#C8D5E8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* إحصائيات المشاريع */}
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-gray-400">أعلى ميزانية</span>
                  <p className="font-bold text-primary">{fmt(Math.max(...(analytics.projectBudgets || []).map(p => p.budget)))}</p>
                </div>
                <div>
                  <span className="text-gray-400">أعلى مصروف</span>
                  <p className="font-bold text-warning">{fmt(Math.max(...(analytics.projectBudgets || []).map(p => p.spent)))}</p>
                </div>
                <div>
                  <span className="text-gray-400">متوسط المتبقي</span>
                  <p className="font-bold text-success">{fmt((analytics.projectBudgets || []).reduce((sum, p) => sum + (p.budget - p.spent), 0) / (analytics.projectBudgets?.length || 1))}</p>
                </div>
              </div>
            </div>

            {/* Expenses by Category - Pie Chart */}
            <div className="card bg-white rounded-xl shadow-lg p-3 sm:p-5 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="font-bold text-gray-700 text-base sm:text-lg">
                  المصروفات حسب التصنيف
                </h3>
                <span className="text-xs text-gray-400">{analytics.expensesByCategory?.length || 0} تصنيف | {analytics.currency}</span>
              </div>
              <div className="h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.expensesByCategory || []}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={window.innerWidth > 768 ? 100 : 70}
                      innerRadius={window.innerWidth > 768 ? 40 : 30}
                      label={({ name, percent }) => window.innerWidth > 768 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                      labelLine={false}
                    >
                      {(analytics.expensesByCategory || []).map((_, i) => {
                        const shades = ["#1E3A5F", "#4F86B4", "#749DC2", "#9FB9D5", "#C8D5E8", "#142B46", "#2D6A4F", "#B5460F"]
                        return <Cell key={i} fill={shades[i % shades.length]} stroke="white" strokeWidth={2} />
                      })}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} />
                    <Legend 
                      wrapperStyle={{ fontSize: window.innerWidth > 768 ? '11px' : '9px', maxHeight: '100px', overflowY: 'auto' }}
                      formatter={(value) => value.length > 15 ? value.substring(0, 12) + '...' : value}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* تفاصيل التصنيفات */}
              <div className="mt-3 pt-3 border-t border-gray-100 max-h-[120px] overflow-y-auto">
                {(analytics.expensesByCategory || []).map((cat, idx) => {
                  const total = (analytics.expensesByCategory || []).reduce((sum, c) => sum + c.total, 0)
                  const percent = (cat.total / total) * 100
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs py-1">
                      <span className="text-gray-600">{cat.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{fmt(cat.total)}</span>
                        <span className="text-gray-400 w-10">{percent.toFixed(1)}%</span>
                        <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards for Quick Insights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4">
            <p className="text-xs text-gray-500">نسبة الإنجاز الكلية</p>
            <p className="text-xl sm:text-2xl font-bold text-primary">{((projectsStatus.completed.count / stats.totalProjects) * 100).toFixed(1)}%</p>
            <p className="text-xs text-gray-400 mt-1">{projectsStatus.completed.count} من {stats.totalProjects} مشروع</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 sm:p-4">
            <p className="text-xs text-gray-500">كفاءة الإنفاق</p>
            <p className="text-xl sm:text-2xl font-bold text-success">{((budgetSummary.totalSpent / budgetSummary.totalBudget) * 100).toFixed(1)}%</p>
            <p className="text-xs text-gray-400 mt-1">من الميزانية المستخدمة</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 sm:p-4">
            <p className="text-xs text-gray-500">المشاريع النشطة</p>
            <p className="text-xl sm:text-2xl font-bold text-warning">{projectsStatus.onTrack.count + (projectsStatus.planned?.count || 0)}</p>
            <p className="text-xs text-gray-400 mt-1">قيد التنفيذ + مخطط له</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 sm:p-4">
            <p className="text-xs text-gray-500">بحاجة للمتابعة</p>
            <p className="text-xl sm:text-2xl font-bold text-danger">{(projectsStatus.delayed?.count || 0) + (projectsStatus.suspended?.count || 0)}</p>
            <p className="text-xs text-gray-400 mt-1">متأخر + متوقف</p>
          </div>
        </div>
      </div>
    </div>
  )
}