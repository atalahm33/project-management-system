import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { fetchProjectById } from '../api/projectsApi'
import { fetchProjectExpenses } from '../api/financeApi'
import {
  getProjectCurrencies, getAllProjectCurrencies,
  getCurrencyLabel, formatCurrencyVal, normalizeBudgets, normalizeCurrencyCode
} from '../api/currencyUtils'

const fmt = n => {
  if (!n) return '0'
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} مليار`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} مليون`
  return n.toLocaleString('ar')
}

const fmtMultiCurrency = (valuesMap, fallback) => {
  if (valuesMap && Object.keys(valuesMap).length > 0) {
    return Object.entries(valuesMap).map(([cur, val]) => formatCurrencyVal(val, cur)).join(' | ')
  }
  return `${fmt(fallback)} ج.م`
}

const fmtMultiCurrencyRemaining = (valuesMap, paidMap, fallback) => {
  if (valuesMap && Object.keys(valuesMap).length > 0) {
    return Object.entries(valuesMap).map(([cur, val]) => {
      const paid = paidMap?.[cur] || 0
      return formatCurrencyVal(val - paid, cur)
    }).join(' | ')
  }
  return `${fmt(fallback)} ج.م`
}

export default function ProjectReportPage() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const printTriggered = useRef(false)

  useEffect(() => {
    const getData = async () => {
      try {
        const [projData, expData] = await Promise.all([
          fetchProjectById(id),
          fetchProjectExpenses(id)
        ])
        setProject(projData)
        setExpenses(expData.expenses || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    getData()
  }, [id])

  useEffect(() => {
    if (!loading && project && !printTriggered.current) {
      printTriggered.current = true
      setTimeout(() => window.print(), 600)
    }
  }, [loading, project])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
      <p style={{ fontSize: '18px', color: '#666' }}>جاري تحميل بيانات التقرير...</p>
    </div>
  )

  if (!project) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
      <p style={{ fontSize: '18px', color: '#999' }}>المشروع غير موجود</p>
    </div>
  )

  // ── Computed Data ──
  const projectBudgets = normalizeBudgets(project?.budgets, project?.totalBudget)
  const budgetCurrencies = getProjectCurrencies(projectBudgets)
  const allCurrencies = getAllProjectCurrencies(project.budgets, project.funding, expenses, project.totalBudget)
  const funding = project.funding || []

  const totalBudgetByCurrency = budgetCurrencies.map(c => ({
    currency: c,
    budget: projectBudgets[c] || 0,
    spent: expenses.filter(e => normalizeCurrencyCode(e.currency) === c).reduce((s, e) => s + e.amount, 0),
    committed: funding.filter(f => normalizeCurrencyCode(f.currency) === c).reduce((s, f) => s + (f.committedAmount || 0), 0),
    received: funding.filter(f => normalizeCurrencyCode(f.currency) === c).reduce((s, f) => s + (f.receivedAmount || 0), 0),
  }))

  const expenseCategories = expenses.reduce((acc, exp) => {
    const existing = acc.find(c => c.category === exp.category)
    if (existing) existing.amount += exp.amount
    else acc.push({ category: exp.category, amount: exp.amount })
    return acc
  }, [])

  const now = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <>
      {/* ── Print Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: 'Cairo', 'Tajawal', 'Segoe UI', sans-serif !important;
          background: #fff !important;
          color: #1a1a1a;
          direction: rtl;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .report-container {
          max-width: 210mm;
          margin: 0 auto;
          padding: 20px 30px;
        }

        .no-print { display: block; }

        @media print {
          .no-print { display: none !important; }
          body { padding: 0; margin: 0; }
          .report-container { max-width: 100%; padding: 10mm 15mm; }
          .page-break { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
        }

        /* ── Header ── */
        .report-header {
          background: linear-gradient(135deg, #1E3A5F 0%, #0F1B2D 100%);
          color: #fff;
          padding: 28px 32px;
          border-radius: 16px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }
        .report-header::after {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 120px; height: 120px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
        }
        .report-header h1 {
          font-size: 22px;
          font-weight: 900;
          margin-bottom: 6px;
          line-height: 1.5;
        }
        .report-header-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: 12px;
          font-size: 11px;
          opacity: 0.85;
        }
        .report-header-meta span {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        /* ── Section ── */
        .report-section {
          margin-bottom: 22px;
        }
        .section-title {
          font-size: 15px;
          font-weight: 800;
          color: #1E3A5F;
          border-bottom: 3px solid #1E3A5F;
          padding-bottom: 8px;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-title .icon {
          width: 28px;
          height: 28px;
          background: #EEF2F7;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        /* ── Info Grid ── */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 24px;
        }
        .info-item {
          display: flex;
          gap: 6px;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .info-label {
          font-size: 11px;
          color: #888;
          font-weight: 600;
          min-width: 110px;
          flex-shrink: 0;
        }
        .info-value {
          font-size: 12px;
          color: #333;
          font-weight: 600;
        }

        /* ── Description Box ── */
        .desc-box {
          background: #F8FAFC;
          border: 1px solid #E8EDF2;
          border-radius: 10px;
          padding: 14px 16px;
          margin-top: 10px;
          font-size: 12px;
          line-height: 1.9;
          color: #444;
          white-space: pre-line;
        }

        /* ── KPI Cards ── */
        .kpi-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }
        .kpi-card {
          background: #FAFBFD;
          border: 1px solid #E8EDF2;
          border-radius: 10px;
          padding: 14px;
          text-align: center;
        }
        .kpi-card .kpi-label {
          font-size: 9px;
          color: #999;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 6px;
        }
        .kpi-card .kpi-value {
          font-size: 14px;
          font-weight: 900;
          color: #1E3A5F;
        }
        .kpi-card .kpi-value.green { color: #059669; }
        .kpi-card .kpi-value.orange { color: #D97706; }
        .kpi-card .kpi-value.blue { color: #0284C7; }

        /* ── Tables ── */
        .report-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-bottom: 16px;
        }
        .report-table thead {
          background: #1E3A5F;
          color: #fff;
        }
        .report-table th {
          padding: 10px 12px;
          text-align: right;
          font-weight: 700;
          font-size: 10px;
          white-space: nowrap;
        }
        .report-table td {
          padding: 9px 12px;
          border-bottom: 1px solid #f0f0f0;
          text-align: right;
          vertical-align: top;
        }
        .report-table tbody tr:nth-child(even) {
          background: #FAFBFD;
        }
        .report-table tbody tr:hover {
          background: #F0F4F8;
        }

        /* ── Funding Card ── */
        .funding-card {
          border: 1px solid #E8EDF2;
          border-radius: 12px;
          margin-bottom: 14px;
          overflow: hidden;
        }
        .funding-card-header {
          background: #F8FAFC;
          padding: 14px 16px;
          border-bottom: 1px solid #E8EDF2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .funding-card-name {
          font-size: 13px;
          font-weight: 800;
          color: #1a1a1a;
        }
        .funding-card-amounts {
          display: flex;
          gap: 18px;
          font-size: 11px;
        }
        .funding-card-amounts .amt-group {
          text-align: center;
        }
        .funding-card-amounts .amt-label {
          font-size: 9px;
          color: #999;
          font-weight: 700;
        }
        .funding-card-amounts .amt-value {
          font-weight: 800;
          color: #333;
        }

        /* ── Contract Card ── */
        .contract-card {
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 10px;
          background: #FAFBFD;
        }
        .contract-card h4 {
          font-size: 13px;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 8px;
        }
        .contract-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          font-size: 11px;
        }
        .contract-meta .cm-label {
          font-size: 9px;
          color: #999;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .contract-meta .cm-value {
          font-weight: 800;
          color: #333;
        }

        /* ── Risk Card ── */
        .risk-card {
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 10px;
        }
        .risk-high { background: #FEF2F2; border: 1px solid #FECACA; }
        .risk-medium { background: #FFFBEB; border: 1px solid #FDE68A; }
        .risk-low { background: #EFF6FF; border: 1px solid #BFDBFE; }
        .risk-severity {
          display: inline-block;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 20px;
          margin-bottom: 8px;
        }
        .risk-card .risk-desc {
          font-size: 12px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
          line-height: 1.8;
        }
        .risk-card .mitigation {
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 11px;
          color: #555;
          line-height: 1.7;
        }

        /* ── Progress Bar ── */
        .progress-bar-container {
          width: 100%;
          height: 16px;
          background: #E5E7EB;
          border-radius: 99px;
          overflow: hidden;
          margin: 8px 0;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(90deg, #1E3A5F, #2D6A4F);
          transition: width 0.6s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 800;
          color: #fff;
        }

        /* ── Footer ── */
        .report-footer {
          border-top: 2px solid #E8EDF2;
          padding-top: 14px;
          margin-top: 24px;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #999;
        }

        /* ── Print Button ── */
        .print-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #1E3A5F;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          z-index: 9999;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
        }
        .print-btn {
          background: #fff;
          color: #1E3A5F;
          border: none;
          padding: 10px 36px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          font-family: 'Cairo', sans-serif;
          transition: all 0.2s;
        }
        .print-btn:hover {
          background: #E8EDF2;
          transform: translateY(-1px);
        }
        .back-btn {
          background: transparent;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 10px 24px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Cairo', sans-serif;
          transition: all 0.2s;
        }
        .back-btn:hover {
          border-color: #fff;
          background: rgba(255,255,255,0.1);
        }

        /* Badge */
        .status-badge {
          display: inline-block;
          padding: 3px 12px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 800;
        }
        .badge-active { background: #DCFCE7; color: #166534; }
        .badge-delayed { background: #FEF2F2; color: #991B1B; }
        .badge-progress { background: #FEF9C3; color: #854D0E; }
        .badge-default { background: #F3F4F6; color: #374151; }
      `}</style>

      {/* ── Print Action Bar ── */}
      <div className="print-bar no-print">
        <button className="back-btn" onClick={() => window.close()}>
          ✕ إغلاق
        </button>
        <button className="print-btn" onClick={() => window.print()}>
          🖨️ طباعة التقرير
        </button>
      </div>

      <div className="report-container" style={{ paddingBottom: '80px' }}>
        {/* ══════════════════════════════════════════════════ */}
        {/* ██ HEADER                                        */}
        {/* ══════════════════════════════════════════════════ */}
        <div className="report-header avoid-break">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '10px', opacity: 0.6, marginBottom: '4px', fontWeight: 700, letterSpacing: '1px' }}>
                تقرير شامل للمشروع
              </div>
              <h1>{project.title}</h1>
            </div>
            <div style={{ textAlign: 'left', fontSize: '10px', opacity: 0.7, lineHeight: 2 }}>
              <div>تاريخ التقرير: {now}</div>
              <div>رمز المشروع: {project._id}</div>
            </div>
          </div>
          <div className="report-header-meta">
            <span>📁 القطاع: {project.sectorId?.name || '—'}</span>
            <span>🏢 الجهة المستفيدة: {project.companyId?.name_ar || project.companyId?.name || '—'}</span>
            <span>📍 الموقع: {project.projectLocation || '—'}</span>
            <span style={{ marginRight: 'auto' }}>
              <span className={`status-badge ${
                project.status === 'معتمد' || project.status === 'مكتمل' ? 'badge-active' :
                project.status === 'متأخر' ? 'badge-delayed' :
                project.status === 'قيد التنفيذ' ? 'badge-progress' : 'badge-default'
              }`}>
                ● {project.status}
              </span>
            </span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* ██ 1. BASIC INFO                                  */}
        {/* ══════════════════════════════════════════════════ */}
        <div className="report-section avoid-break">
          <div className="section-title">
            <span className="icon">📋</span>
            بيانات المشروع الأساسية
          </div>

          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">اسم المشروع</span>
              <span className="info-value">{project.title}</span>
            </div>
            <div className="info-item">
              <span className="info-label">القطاع</span>
              <span className="info-value">{project.sectorId?.name || '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">الجهة المستفيدة</span>
              <span className="info-value">{project.companyId?.name_ar || project.companyId?.name || '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">الجهة المنفذة</span>
              <span className="info-value">{project.beneficiaryEntity || '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">تاريخ المشروع</span>
              <span className="info-value">{project.projectDate || (project.startDate ? new Date(project.startDate).toLocaleDateString('ar-EG') : '—')}</span>
            </div>
            <div className="info-item">
              <span className="info-label">موقع المشروع</span>
              <span className="info-value">{project.projectLocation || '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">حالة المشروع</span>
              <span className="info-value">{project.status}</span>
            </div>
            <div className="info-item">
              <span className="info-label">نسبة الإنجاز</span>
              <span className="info-value">{project.completionPercentage || 0}%</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
              <span style={{ color: '#666', fontWeight: 600 }}>نسبة الإنجاز التقديرية</span>
              <span style={{ fontWeight: 800, color: '#1E3A5F' }}>{project.completionPercentage || 0}%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${project.completionPercentage || 0}%` }}>
                {(project.completionPercentage || 0) > 15 ? `${project.completionPercentage}%` : ''}
              </div>
            </div>
          </div>
        </div>

        {/* ── Description ── */}
        {project.description && (
          <div className="report-section avoid-break">
            <div className="section-title">
              <span className="icon">📝</span>
              وصف وأهداف المشروع
            </div>
            <div className="desc-box">{project.description}</div>
          </div>
        )}

        {/* ── Execution Details ── */}
        {project.executionDetails && (
          <div className="report-section avoid-break">
            <div className="section-title">
              <span className="icon">⚙️</span>
              تفاصيل التنفيذ والعمل الجاري
            </div>
            <div className="desc-box">{project.executionDetails}</div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* ██ 2. FINANCIAL OVERVIEW                          */}
        {/* ══════════════════════════════════════════════════ */}
        <div className="page-break"></div>
        <div className="report-section">
          <div className="section-title">
            <span className="icon">💰</span>
            الملخص المالي للمشروع
          </div>

          {/* KPI Cards per Currency */}
          {totalBudgetByCurrency.map(item => (
            <div key={item.currency} style={{ marginBottom: '16px' }} className="avoid-break">
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#1E3A5F', marginBottom: '8px', background: '#EEF2F7', padding: '6px 14px', borderRadius: '8px', display: 'inline-block' }}>
                {getCurrencyLabel(item.currency)}
              </div>
              <div className="kpi-row">
                <div className="kpi-card">
                  <div className="kpi-label">الميزانية التخطيطية</div>
                  <div className="kpi-value">{formatCurrencyVal(item.budget, item.currency)}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">التمويل المعتمد</div>
                  <div className="kpi-value blue">{formatCurrencyVal(item.committed, item.currency)}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">المبالغ المستلمة</div>
                  <div className="kpi-value green">{formatCurrencyVal(item.received, item.currency)}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">المنصرف الفعلي</div>
                  <div className="kpi-value orange">{formatCurrencyVal(item.spent, item.currency)}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Budget Comparison Table */}
          {allCurrencies.length > 1 && (
            <div className="avoid-break" style={{ marginTop: '10px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#555', marginBottom: '8px' }}>مقارنة الميزانيات (كل العملات)</h4>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>العملة</th>
                    <th>الميزانية</th>
                    <th>المنصرف</th>
                    <th>المتبقي</th>
                  </tr>
                </thead>
                <tbody>
                  {allCurrencies.map(c => {
                    const b = projectBudgets[c] || 0
                    const s = expenses.filter(e => normalizeCurrencyCode(e.currency) === c).reduce((sum, e) => sum + e.amount, 0)
                    const rem = b - s
                    return (
                      <tr key={c}>
                        <td style={{ fontWeight: 800 }}>{getCurrencyLabel(c)}</td>
                        <td>{formatCurrencyVal(b, c)}</td>
                        <td style={{ color: '#D97706' }}>{formatCurrencyVal(s, c)}</td>
                        <td style={{ color: rem < 0 ? '#DC2626' : '#059669', fontWeight: 700 }}>{formatCurrencyVal(rem, c)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* ██ 3. FUNDING SOURCES                             */}
        {/* ══════════════════════════════════════════════════ */}
        {funding.length > 0 && (
          <div className="report-section">
            <div className="section-title">
              <span className="icon">🏦</span>
              مصادر التمويل والدفعات المالية
            </div>

            {funding.map(f => (
              <div key={f._id} className="funding-card avoid-break">
                <div className="funding-card-header">
                  <div>
                    <div className="funding-card-name">{f.sourceName}</div>
                    <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                      النوع: {f.sourceType} | العملة: {getCurrencyLabel(f.currency)} | الحالة: {f.status}
                    </div>
                  </div>
                  <div className="funding-card-amounts">
                    <div className="amt-group">
                      <div className="amt-label">المعتمد</div>
                      <div className="amt-value">{formatCurrencyVal(f.committedAmount, f.currency)}</div>
                    </div>
                    <div className="amt-group">
                      <div className="amt-label">المستلم</div>
                      <div className="amt-value" style={{ color: '#059669' }}>{formatCurrencyVal(f.receivedAmount, f.currency)}</div>
                    </div>
                    <div className="amt-group">
                      <div className="amt-label">المتبقي</div>
                      <div className="amt-value" style={{ color: '#1E3A5F' }}>{formatCurrencyVal(f.remainingAmount, f.currency)}</div>
                    </div>
                  </div>
                </div>

                {/* Transactions */}
                {f.transactions?.length > 0 && (
                  <table className="report-table" style={{ marginBottom: 0 }}>
                    <thead>
                      <tr>
                        <th>تاريخ الدفعة</th>
                        <th>رقم المرجع</th>
                        <th>ملاحظات</th>
                        <th>القيمة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {f.transactions.map(t => (
                        <tr key={t._id}>
                          <td>{new Date(t.transactionDate).toLocaleDateString('ar-EG')}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '10px' }}>{t.referenceNumber}</td>
                          <td style={{ color: '#666' }}>{t.notes || '—'}</td>
                          <td style={{ fontWeight: 800, color: '#1E3A5F' }}>{formatCurrencyVal(t.amount, f.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* ██ 4. EXPENSES                                    */}
        {/* ══════════════════════════════════════════════════ */}
        {expenses.length > 0 && (
          <div className="report-section">
            <div className="section-title" style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="icon">🧾</span>
                سجل المصروفات التفصيلي
              </span>
              <span style={{ fontSize: '10px', color: '#999', fontWeight: 600 }}>
                إجمالي المعاملات: {expenses.length}
              </span>
            </div>

            {/* Expense Categories Summary */}
            {expenseCategories.length > 0 && (
              <div className="avoid-break" style={{ marginBottom: '14px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#888', marginBottom: '8px' }}>توزيع المصروفات حسب الفئة</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {expenseCategories.map((cat, i) => (
                    <div key={i} style={{
                      background: '#F8FAFC',
                      border: '1px solid #E8EDF2',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '11px',
                    }}>
                      <span style={{ fontWeight: 800, color: '#333' }}>{cat.category}</span>
                      <span style={{ color: '#888', margin: '0 6px' }}>—</span>
                      <span style={{ fontWeight: 700, color: '#D97706' }}>{fmt(cat.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <table className="report-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>التاريخ</th>
                  <th>العملة</th>
                  <th>الفئة</th>
                  <th>البيان</th>
                  <th>المورد</th>
                  <th>القيمة</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp, i) => (
                  <tr key={exp._id}>
                    <td style={{ color: '#aaa', fontWeight: 700 }}>{i + 1}</td>
                    <td>{new Date(exp.date).toLocaleDateString('ar-EG')}</td>
                    <td style={{ fontWeight: 700 }}>{exp.currency}</td>
                    <td>{exp.category}</td>
                    <td style={{ fontWeight: 600 }}>{exp.description}</td>
                    <td style={{ color: '#666' }}>{exp.vendor}</td>
                    <td style={{ fontWeight: 800, color: '#1E3A5F' }}>{formatCurrencyVal(exp.amount, exp.currency)}</td>
                    <td>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: exp.status === 'معتمد' ? '#DCFCE7' : '#FEF9C3',
                        color: exp.status === 'معتمد' ? '#166534' : '#854D0E',
                      }}>
                        {exp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* ██ 5. CONTRACTS                                   */}
        {/* ══════════════════════════════════════════════════ */}
        {project.contracts?.length > 0 && (
          <div className="report-section">
            <div className="section-title">
              <span className="icon">📑</span>
              العقود المرتبطة بالمشروع
              <span style={{ fontSize: '10px', color: '#999', fontWeight: 600, marginRight: 'auto' }}>
                عدد العقود: {project.contracts.length}
              </span>
            </div>

            {project.contracts.map((c, i) => {
              const isChild = c.parentContractId && project.contracts.some(pc => pc._id === c.parentContractId)
              return (
                <div key={c._id} className="contract-card avoid-break" style={isChild ? { borderRight: '4px solid #8B5CF6', marginRight: '20px' } : {}}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0 }}>
                      {isChild && <span style={{ fontSize: '10px', color: '#8B5CF6', marginLeft: '6px' }}>↳ عقد فرعي</span>}
                      {c.contractorName}
                    </h4>
                    <span style={{ fontSize: '9px', color: '#999', fontFamily: 'monospace' }}>{c._id}</span>
                  </div>

                  {c.description && (
                    <p style={{ fontSize: '11px', color: '#666', marginBottom: '10px', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                      {c.description}
                    </p>
                  )}

                  <div className="contract-meta">
                    <div>
                      <div className="cm-label">قيمة العقد</div>
                      <div className="cm-value">{fmtMultiCurrency(c.values, c.contractValue)}</div>
                    </div>
                    <div>
                      <div className="cm-label">المبلغ المدفوع</div>
                      <div className="cm-value" style={{ color: '#059669' }}>{fmtMultiCurrency(c.paidAmounts, c.paidAmount)}</div>
                    </div>
                    <div>
                      <div className="cm-label">المتبقي</div>
                      <div className="cm-value" style={{ color: '#1E3A5F' }}>{fmtMultiCurrencyRemaining(c.values, c.paidAmounts, c.remainingAmount)}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* ██ 6. RISKS                                       */}
        {/* ══════════════════════════════════════════════════ */}
        <div className="report-section">
          <div className="section-title">
            <span className="icon">⚠️</span>
            سجل المخاطر والتحديات
            <span style={{ fontSize: '10px', color: '#999', fontWeight: 600, marginRight: 'auto' }}>
              {project.risks?.length > 0 ? `${project.risks.length} خطر مُسجَّل` : 'لا توجد مخاطر'}
            </span>
          </div>

          {project.risks?.length > 0 ? (
            <div>
              {/* Risk Summary */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }} className="avoid-break">
                {['عالي', 'متوسط', 'منخفض'].map(sev => {
                  const count = project.risks.filter(r => r.severity === sev).length
                  const colors = {
                    'عالي': { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
                    'متوسط': { bg: '#FFFBEB', color: '#854D0E', border: '#FDE68A' },
                    'منخفض': { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' },
                  }
                  return (
                    <div key={sev} style={{
                      background: colors[sev].bg,
                      border: `1px solid ${colors[sev].border}`,
                      borderRadius: '10px',
                      padding: '10px 18px',
                      textAlign: 'center',
                      flex: 1,
                    }}>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: colors[sev].color }}>{count}</div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: colors[sev].color }}>تأثير {sev}</div>
                    </div>
                  )
                })}
              </div>

              {/* Risk Cards */}
              {project.risks.map((r, i) => (
                <div key={i} className={`risk-card avoid-break ${
                  r.severity === 'عالي' ? 'risk-high' : r.severity === 'متوسط' ? 'risk-medium' : 'risk-low'
                }`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="risk-severity" style={{
                      background: r.severity === 'عالي' ? '#FCA5A5' : r.severity === 'متوسط' ? '#FDE68A' : '#93C5FD',
                      color: r.severity === 'عالي' ? '#7F1D1D' : r.severity === 'متوسط' ? '#713F12' : '#1E3A8A',
                    }}>
                      ⚠ تأثير {r.severity}
                    </span>
                    <span style={{ fontSize: '10px', color: '#888', fontWeight: 600 }}>{r.status || 'نشط'}</span>
                  </div>
                  <div className="risk-desc">{r.description}</div>
                  {r.mitigationPlan && (
                    <div className="mitigation">
                      <span style={{ fontSize: '9px', fontWeight: 800, color: '#059669', display: 'block', marginBottom: '4px' }}>
                        🛡️ خطة التخفيف
                      </span>
                      {r.mitigationPlan}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '30px',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '12px',
              color: '#166534',
              fontSize: '13px',
              fontWeight: 700,
            }}>
              ✅ لا توجد مخاطر مُسجَّلة — الوضع مستقر
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* ██ FOOTER                                         */}
        {/* ══════════════════════════════════════════════════ */}
        <div className="report-footer avoid-break">
          <span>تقرير مُنشأ آلياً — منصة إدارة المشروعات</span>
          <span>تاريخ الإصدار: {now}</span>
        </div>
      </div>
    </>
  )
}
