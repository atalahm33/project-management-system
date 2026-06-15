import { FileText, Download, Printer, Eye } from 'lucide-react'

const REPORTS = [
  { id: 1, title: 'التقرير الشهري – أبريل 2026',      type: 'شهري',   date: '2026-04-30', pages: 24 },
  { id: 2, title: 'تقرير الميزانية الفصلي Q1 2026',   type: 'فصلي',   date: '2026-03-31', pages: 48 },
  { id: 3, title: 'تقرير المشروعات المتأخرة',           type: 'خاص',    date: '2026-04-15', pages: 12 },
  { id: 4, title: 'تقرير الأداء السنوي 2025',          type: 'سنوي',   date: '2025-12-31', pages: 96 },
  { id: 5, title: 'تقرير القطاع الصحي',                type: 'قطاعي',  date: '2026-04-01', pages: 32 },
  { id: 6, title: 'ملخص مصادر التمويل – Q1',          type: 'مالي',   date: '2026-03-31', pages: 18 },
]

const TYPE_COLOR = {
  شهري: 'badge-info', فصلي: 'badge-warning', خاص: 'badge-danger',
  سنوي: 'badge-gray', قطاعي: 'badge-success', مالي: 'badge-info',
}

export default function ReportsPage() {
  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h2 className="page-title">التقارير</h2>
          <p className="page-subtitle">عرض وتصدير تقارير المشروعات والميزانيات</p>
        </div>
        <button className="btn-primary"><Download size={16} /> تصدير تقرير جديد</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
        {REPORTS.map((r, i) => (
          <div key={r.id} className="card hover:shadow-navy-lg transition-all animate-fade-in-up"
            style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 text-sm leading-snug">{r.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{r.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className={`badge ${TYPE_COLOR[r.type] || 'badge-gray'}`}>{r.type}</span>
              <span className="text-xs text-gray-400">{r.pages} صفحة</span>
            </div>

            <div className="flex items-center gap-2">
              <button className="btn-secondary flex-1 justify-center text-xs py-2">
                <Eye size={14} /> معاينة
              </button>
              <button className="btn-ghost px-3 py-2 border border-gray-200 rounded-lg">
                <Download size={14} />
              </button>
              <button className="btn-ghost px-3 py-2 border border-gray-200 rounded-lg">
                <Printer size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Placeholder */}
      <div className="card">
        <h3 className="font-bold text-gray-700 mb-4">معاينة التقرير</h3>
        <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200
                        flex flex-col items-center justify-center py-20 text-gray-400">
          <FileText size={40} className="mb-3 opacity-40" />
          <p className="font-medium">اختر تقريراً لمعاينته</p>
          <p className="text-xs mt-1">سيظهر التقرير هنا بتنسيق PDF</p>
        </div>
      </div>
    </div>
  )
}
