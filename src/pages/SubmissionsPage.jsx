import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMySubmissions, getPendingSubmissions, reviewSubmission, updateSubmission, deleteSubmission } from '../api/submissionApi';
import {
  CheckCircle, XCircle, Clock, AlertCircle, RefreshCw,
  FileSignature, CreditCard, Wallet, BarChart3, X, MessageSquare,
  Building2, Calendar, DollarSign, User, ChevronDown, ChevronUp, History, Edit3, Send, Trash2,
  FileText, Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CURRENCY_CODES, getCurrencyLabel, getProjectCurrencies, formatCurrencyVal, normalizeBudgets, normalizeCurrencyCode } from '../api/currencyUtils';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// --------------------------------------------
// Status Badge Component
// --------------------------------------------
const StatusBadge = ({ status }) => {
  const map = {
    pending_review: { label: 'قيد المراجعة', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', Icon: Clock },
    approved: { label: 'معتمد', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', Icon: CheckCircle },
    needs_changes: { label: 'يحتاج تعديل', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', Icon: AlertCircle },
  };
  const s = map[status] || { label: status, bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', Icon: AlertCircle };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${ s.bg } ${ s.text } ${ s.border }`}>
      <s.Icon size={11} />
      {s.label}
    </span>
  );
};

// --------------------------------------------
// Type Configuration
// --------------------------------------------
const TYPE_CONFIG = {
  contract: { label: 'العقود', Icon: FileSignature, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  expense: { label: 'المصروفات', Icon: CreditCard, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
  funding: { label: 'التمويلات', Icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  progress: { label: 'نسب الإنجاز', Icon: BarChart3, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
  transaction: { label: 'المدفوعات', Icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
};

const fmt = (n) => Number(n || 0).toLocaleString('ar-EG');

const renderMultiCurrency = (valuesMap, fallbackValue) => {
  if (valuesMap && Object.keys(valuesMap).length > 0) {
    return (
      <div className="flex flex-col gap-0.5 items-end">
        {Object.entries(valuesMap).map(([cur, val]) => (
          <span key={cur} className="whitespace-nowrap">{formatCurrencyVal(val, cur)}</span>
        ))}
      </div>
    );
  }
  return <span className="whitespace-nowrap">{fmt(fallbackValue)} ج.م</span>;
};

const renderMultiCurrencyRemaining = (valuesMap, paidMap, fallbackRemaining) => {
  if (valuesMap && Object.keys(valuesMap).length > 0) {
    return (
      <div className="flex flex-col gap-0.5 items-end">
        {Object.entries(valuesMap).map(([cur, val]) => {
          const paid = paidMap?.[cur] || 0;
          return <span key={cur} className="whitespace-nowrap">{formatCurrencyVal(val - paid, cur)}</span>
        })}
      </div>
    );
  }
  return <span className="whitespace-nowrap">{fmt(fallbackRemaining)} ج.م</span>;
};

// --------------------------------------------
// Review Modal
// --------------------------------------------
const ReviewModal = ({ item, type, onClose, onAction }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (action) => {
    if (action === 'needs_changes' && !reason.trim()) {
      toast.error('يرجى كتابة سبب طلب التعديل');
      return;
    }
    setLoading(true);
    await onAction(type, item._id, action, reason);
    setLoading(false);
    onClose();
  };

  const projectTitle = item.projectId?.title || 'مشروع غير معروف';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">مراجعة الطلب</h3>
            <p className="text-sm text-slate-500 mt-0.5">{projectTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            {type === 'contract' && (
              <>
                <InfoRow icon={User} label="المقاول" value={item.contractorName} />
                <InfoRow icon={DollarSign} label="قيمة العقد" value={renderMultiCurrency(item.values, item.contractValue)} />
                <InfoRow icon={DollarSign} label="المدفوع" value={renderMultiCurrency(item.paidAmounts, item.paidAmount)} />
              </>
            )}
            {type === 'expense' && (
              <>
                <InfoRow icon={Building2} label="البند" value={item.category} />
                <InfoRow icon={DollarSign} label="المبلغ" value={formatCurrencyVal(item.amount, item.currency)} />
                <InfoRow icon={User} label="المورد" value={item.vendor} />
              </>
            )}
            {type === 'funding' && (
              <>
                <InfoRow icon={Building2} label="المصدر" value={item.sourceName} />
                <InfoRow icon={DollarSign} label="المبلغ الملزم" value={formatCurrencyVal(item.committedAmount, item.currency)} />
                <InfoRow icon={DollarSign} label="المبلغ المستلم" value={formatCurrencyVal(item.receivedAmount, item.currency)} />
              </>
            )}
            {type === 'progress' && (
              <InfoRow icon={BarChart3} label="نسبة الإنجاز" value={`${ item.progressPercentage }%`} />
            )}
            {type === 'transaction' && (
              <>
                <InfoRow icon={DollarSign} label="المبلغ" value={`${ fmt(item.amount) } ج.م`} />
                <InfoRow icon={CreditCard} label="طريقة الدفع" value={item.paymentMethod} />
                <InfoRow icon={Building2} label="مصدر التمويل" value={item.fundingSourceId?.sourceName || 'غير متوفر'} />
              </>
            )}
            <InfoRow icon={Calendar} label="تاريخ الإرسال" value={new Date(item.createdAt).toLocaleDateString('ar-EG')} />
          </div>

          {/* Notes */}
          {item.description && (
            <div className="text-sm text-slate-600 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <span className="font-bold text-blue-700">ملاحظات: </span>{item.description}
            </div>
          )}

          {/* Reason textarea */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <MessageSquare size={14} />
              سبب طلب التعديل (مطلوب عند الرفض)
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="اكتب ملاحظاتك هنا..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all resize-none text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-100 bg-slate-50">
          <button
            disabled={loading}
            onClick={() => submit('approve')}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all disabled:opacity-60"
          >
            <CheckCircle size={18} />
            اعتماد
          </button>
          <button
            disabled={loading}
            onClick={() => submit('needs_changes')}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all disabled:opacity-60"
          >
            <XCircle size={18} />
            طلب تعديل
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-slate-500 flex items-center gap-1.5">
      <Icon size={12} />
      {label}
    </span>
    <span className="text-sm font-semibold text-slate-700">{value || '—'}</span>
  </div>
);

// --------------------------------------------
// Submission Card
// --------------------------------------------
const SubmissionCard = ({ item, type, isReviewTab, onReview, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[type];
  const projectTitle = item.projectId?.title || 'مشروع غير معروف';
  const hasRejectReason = item.rejectionReason || item.submissionStatus === 'needs_changes';

  return (
    <div className={`bg-white rounded-2xl border ${ expanded ? 'border-blue-200 shadow-md' : 'border-slate-100 shadow-sm' } overflow-hidden transition-all duration-300`}>
      {/* Card Header */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50/80 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`w-11 h-11 rounded-xl ${ cfg.bg } ${ cfg.border } border flex items-center justify-center flex-shrink-0`}>
          <cfg.Icon size={20} className={cfg.color} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800 text-sm truncate">{projectTitle}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${ cfg.bg } ${ cfg.color } font-semibold`}>{cfg.label}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
            {type === 'contract' && <span>مقاول: <b className="text-slate-700">{item.contractorName}</b></span>}
            {type === 'expense' && <span>بند: <b className="text-slate-700">{item.category}</b></span>}
            {type === 'funding' && <span>مصدر: <b className="text-slate-700">{item.sourceName}</b></span>}
            {type === 'progress' && <span>نسبة: <b className="text-slate-700">{item.progressPercentage}%</b></span>}
            {type === 'transaction' && <span>دفع من: <b className="text-slate-700">{item.fundingSourceId?.sourceName || 'مجهول'}</b></span>}
            <span className="flex items-center gap-1"><Calendar size={11} />{new Date(item.createdAt).toLocaleDateString('ar-EG')}</span>
            {item.createdBy?.name && <span className="flex items-center gap-1"><User size={11} />{item.createdBy.name}</span>}
          </div>
        </div>

        <div className="text-right hidden sm:block">
          {(type === 'contract' || type === 'expense' || type === 'funding' || type === 'transaction') && (
            <div className="font-bold text-slate-800 text-sm">
              {type === 'expense' ? formatCurrencyVal(item.amount, item.currency) : type === 'contract' ? renderMultiCurrency(item.values, item.contractValue) : type === 'funding' ? formatCurrencyVal(item.committedAmount, item.currency) : fmt(item.amount || item.receivedAmount)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusBadge status={item.submissionStatus} />
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50">
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">تفاصيل الطلب</h4>
              <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-2.5">
                {type === 'contract' && (
                  <>
                    <DetailRow label="اسم المقاول" value={item.contractorName} />
                    <DetailRow label="قيمة العقد" value={renderMultiCurrency(item.values, item.contractValue)} highlight />
                    <DetailRow label="المبلغ المدفوع" value={renderMultiCurrency(item.paidAmounts, item.paidAmount)} />
                    <DetailRow label="المتبقي" value={renderMultiCurrencyRemaining(item.values, item.paidAmounts, item.remainingAmount)} />
                  </>
                )}
                {type === 'expense' && (
                  <>
                    <DetailRow label="البند" value={item.category} />
                    <DetailRow label="المبلغ" value={formatCurrencyVal(item.amount, item.currency)} highlight />
                    <DetailRow label="العملة" value={getCurrencyLabel(item.currency)} />
                    <DetailRow label="المورد" value={item.vendor} />
                    {item.description && <DetailRow label="الوصف" value={item.description} />}
                  </>
                )}
                {type === 'funding' && (
                  <>
                    <DetailRow label="مصدر التمويل" value={item.sourceName} />
                    <DetailRow label="المبلغ الملزم" value={formatCurrencyVal(item.committedAmount, item.currency)} />
                    <DetailRow label="المبلغ المستلم" value={formatCurrencyVal(item.receivedAmount, item.currency)} highlight />
                  </>
                )}
                {type === 'progress' && (
                  <>
                    <DetailRow label="نسبة الإنجاز" value={`${ item.progressPercentage }%`} highlight />
                    {item.notes && <DetailRow label="ملاحظات" value={item.notes} />}
                  </>
                )}
                {type === 'transaction' && (
                  <>
                    <DetailRow label="المبلغ" value={`${ fmt(item.amount) } ج.م`} highlight />
                    <DetailRow label="طريقة الدفع" value={item.paymentMethod} />
                    {item.referenceNumber && <DetailRow label="الرقم المرجعي" value={item.referenceNumber} />}
                    <DetailRow label="مصدر التمويل" value={item.fundingSourceId?.sourceName || 'غير متوفر'} />
                  </>
                )}
                <DetailRow label="أُرسل بواسطة" value={item.createdBy?.name} />
                <DetailRow label="تاريخ الإرسال" value={new Date(item.createdAt).toLocaleString('ar-EG')} />
              </div>
            </div>

            <div className="space-y-3">
              {hasRejectReason && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">سبب طلب التعديل</h4>
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{item.rejectionReason}</p>
                  </div>
                </div>
              )}

              {item.reviewHistory?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <History size={12} />
                    سجل المراجعات
                  </h4>
                  <div className="space-y-2">
                    {item.reviewHistory.map((h, i) => (
                      <div key={h._id || i} className="bg-white border border-slate-100 rounded-xl p-3 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <StatusBadge status={h.status} />
                          <span className="text-slate-400">{new Date(h.reviewedAt).toLocaleString('ar-EG')}</span>
                        </div>
                        {h.comment && <p className="text-slate-600 mt-1">{h.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {item.images?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">المرفقات</h4>
                  <div className="flex flex-wrap gap-2">
                    {item.images.map((img, i) => {
                      const fullUrl = img.startsWith('http') ? img : `${API_BASE}${img}`
                      const isPdf = fullUrl.toLowerCase().endsWith('.pdf')
                      return isPdf ? (
                        <a key={i} href={fullUrl} target="_blank" rel="noopener noreferrer"
                          className="w-16 h-16 rounded-xl border border-slate-200 bg-red-50 flex flex-col items-center justify-center gap-1 hover:scale-105 transition-transform cursor-pointer"
                        >
                          <FileSignature size={20} className="text-red-500" />
                          <span className="text-[9px] text-red-600 font-bold">PDF</span>
                        </a>
                      ) : (
                        <a key={i} href={fullUrl} target="_blank" rel="noopener noreferrer">
                          <img
                            src={fullUrl}
                            alt={`مرفق ${i + 1}`}
                            className="w-16 h-16 object-cover rounded-xl border border-slate-200 hover:scale-105 transition-transform cursor-pointer"
                          />
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-5 pb-5 flex gap-3">
            {isReviewTab && item.submissionStatus === 'pending_review' && (
              <button
                onClick={() => onReview(item, type)}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <MessageSquare size={16} />
                مراجعة واتخاذ قرار
              </button>
            )}
            {!isReviewTab && item.submissionStatus === 'needs_changes' && (
              <button
                onClick={() => onEdit(item, type)}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Edit3 size={16} />
                تعديل وإعادة الإرسال
              </button>
            )}
            {item.submissionStatus !== 'approved' && (
              <button
                onClick={() => onDelete(type, item._id)}
                className="px-5 py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 size={16} />
                حذف الطلب
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --------------------------------------------
// Edit & Resubmit Modal
// --------------------------------------------
const EXPENSE_CATEGORIES = ['مواد خام وتوريدات', 'أجور وعمالة فنية', 'إيجار/شراء معدات', 'مستخلصات مقاولين باطن', 'مصارييف إدارية أخرى'];

const EditSubmissionModal = ({ item, type, onClose, onSaved }) => {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const expenseCurrencyOptions = type === 'expense'
    ? getProjectCurrencies(normalizeBudgets(item?.projectId?.budgets, item?.projectId?.totalBudget))
    : CURRENCY_CODES;

  useEffect(() => {
    if (!item) return;
    if (type === 'expense') {
      setForm({
        amount: item.amount ?? '',
        currency: normalizeCurrencyCode(item.currency),
        category: item.category ?? '',
        vendor: item.vendor ?? '',
        description: item.description ?? '',
      });
    } else if (type === 'contract') {
      setForm({
        contractorName: item.contractorName ?? '',
        contractValue: item.contractValue ?? '',
        paidAmount: item.paidAmount ?? '',
      });
    } else if (type === 'funding') {
      setForm({
        sourceName: item.sourceName ?? '',
        currency: normalizeCurrencyCode(item.currency),
        committedAmount: item.committedAmount ?? '',
        receivedAmount: item.receivedAmount ?? '',
        description: item.description ?? '',
      });
    } else if (type === 'progress') {
      setForm({
        progressPercentage: item.progressPercentage ?? '',
        executionDetails: item.executionDetails ?? '',
        notes: item.notes ?? '',
      });
    } else if (type === 'transaction') {
      setForm({
        amount: item.amount ?? '',
        paymentMethod: item.paymentMethod ?? 'تحويل بنكي',
        referenceNumber: item.referenceNumber ?? '',
      });
    }
  }, [item, type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let payload = form;
      if (type === 'expense') {
        payload = { ...form, currency: normalizeCurrencyCode(form.currency), amount: Number(form.amount) };
      } else if (type === 'funding') {
        payload = { ...form, currency: normalizeCurrencyCode(form.currency) };
      }
      await updateSubmission(type, item._id, payload);
      toast.success('✅ تم إعادة إرسال الطلب بنجاح');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء الإرسال');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all text-sm bg-white';
  const labelCls = 'text-xs font-bold text-slate-600 mb-1 block';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-amber-50">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Edit3 size={18} className="text-amber-600" />
              تعديل وإعادة الإرسال
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{item?.projectId?.title || 'مشروع'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {item?.rejectionReason && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
            <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs font-bold text-red-600 block">سبب طلب التعديل:</span>
              <p className="text-xs text-red-700 mt-0.5">{item.rejectionReason}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {type === 'expense' && (
            <>
              <div><label className={labelCls}>المبلغ</label><input type="number" name="amount" value={form.amount} onChange={handleChange} required className={inputCls} placeholder="0" /></div>
              <div><label className={labelCls}>العملة</label><select name="currency" value={form.currency || 'EGP'} onChange={handleChange} className={inputCls}>{expenseCurrencyOptions.map(code => (<option key={code} value={code}>{getCurrencyLabel(code)}</option>))}</select></div>
              <div><label className={labelCls}>البند</label><select name="category" value={form.category} onChange={handleChange} className={inputCls}>{EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className={labelCls}>المورد</label><input type="text" name="vendor" value={form.vendor} onChange={handleChange} className={inputCls} placeholder="اسم المورد" /></div>
              <div><label className={labelCls}>الوصف</label><textarea name="description" rows={3} value={form.description} onChange={handleChange} className={inputCls + ' resize-none'} placeholder="وصف المصروف..." /></div>
            </>
          )}

          {type === 'contract' && (
            <>
              <div><label className={labelCls}>اسم المقاول</label><input type="text" name="contractorName" value={form.contractorName} onChange={handleChange} required className={inputCls} /></div>
              <div><label className={labelCls}>قيمة العقد (ج.م)</label><input type="number" name="contractValue" value={form.contractValue} onChange={handleChange} required className={inputCls} /></div>
              <div><label className={labelCls}>المبلغ المدفوع (ج.م)</label><input type="number" name="paidAmount" value={form.paidAmount} onChange={handleChange} className={inputCls} /></div>
            </>
          )}

          {type === 'funding' && (
            <>
              <div><label className={labelCls}>اسم مصدر التمويل</label><input type="text" name="sourceName" value={form.sourceName} onChange={handleChange} required className={inputCls} /></div>
              <div><label className={labelCls}>العملة</label><select name="currency" value={form.currency || 'EGP'} onChange={handleChange} className={inputCls}>{CURRENCY_CODES.map(code => (<option key={code} value={code}>{getCurrencyLabel(code)}</option>))}</select></div>
              <div><label className={labelCls}>المبلغ الملزم</label><input type="number" name="committedAmount" value={form.committedAmount} onChange={handleChange} className={inputCls} /></div>
              <div><label className={labelCls}>المبلغ المستلم</label><input type="number" name="receivedAmount" value={form.receivedAmount} onChange={handleChange} className={inputCls} /></div>
              <div><label className={labelCls}>ملاحظات</label><textarea name="description" rows={2} value={form.description} onChange={handleChange} className={inputCls + ' resize-none'} /></div>
            </>
          )}

          {type === 'progress' && (
            <>
              <div><label className={labelCls}>نسبة الإنجاز (%)</label><input type="number" min="0" max="100" name="progressPercentage" value={form.progressPercentage} onChange={handleChange} required className={inputCls} /></div>
              <div><label className={labelCls}>تفاصيل التنفيذ</label><textarea name="executionDetails" rows={2} value={form.executionDetails} onChange={handleChange} className={inputCls + ' resize-none'} /></div>
              <div><label className={labelCls}>ملاحظات</label><textarea name="notes" rows={2} value={form.notes} onChange={handleChange} className={inputCls + ' resize-none'} /></div>
            </>
          )}

          {type === 'transaction' && (
            <>
              <div><label className={labelCls}>المبلغ (ج.م)</label><input type="number" name="amount" value={form.amount} onChange={handleChange} required className={inputCls} placeholder="0" /></div>
              <div><label className={labelCls}>طريقة الدفع</label><select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} className={inputCls}>{['تحويل بنكي', 'شيك', 'نقدي', 'أخرى'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className={labelCls}>رقم التحويل أو الشيك</label><input type="text" name="referenceNumber" value={form.referenceNumber} onChange={handleChange} className={inputCls} /></div>
            </>
          )}
        </form>

        <div className="flex gap-3 p-5 border-t border-slate-100 bg-slate-50">
          <button disabled={loading} onClick={handleSubmit} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-60 text-sm">
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
            إعادة الإرسال للمراجعة
          </button>
          <button onClick={onClose} className="px-5 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold text-sm transition-all">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, highlight }) => (
  <div className="flex justify-between items-start gap-2">
    <span className="text-xs text-slate-500 whitespace-nowrap">{label}</span>
    <span className={`text-xs font-semibold text-right ${ highlight ? 'text-blue-700' : 'text-slate-700' }`}>{value || '—'}</span>
  </div>
);

// --------------------------------------------
// Section Component
// --------------------------------------------
const Section = ({ items, type, isReviewTab, onReview, onEdit, onDelete }) => {
  const cfg = TYPE_CONFIG[type];
  if (!items?.length) return null;
  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-2 px-1`}>
        <div className={`w-7 h-7 rounded-lg ${ cfg.bg } flex items-center justify-center`}>
          <cfg.Icon size={14} className={cfg.color} />
        </div>
        <span className="font-bold text-slate-700">{cfg.label}</span>
        <span className="ml-auto text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-semibold">{items.length}</span>
      </div>
      <div className="space-y-3">
        {items.map(item => (
          <SubmissionCard key={item._id} item={item} type={type} isReviewTab={isReviewTab} onReview={onReview} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
};

// --------------------------------------------
// Stats Bar
// --------------------------------------------
const StatsBar = ({ data }) => {
  const all = [...(data.contracts || []), ...(data.expenses || []), ...(data.fundings || []), ...(data.progress || []), ...(data.transactions || [])];
  const counts = {
    total: all.length,
    pending: all.filter(x => x.submissionStatus === 'pending_review').length,
    approved: all.filter(x => x.submissionStatus === 'approved').length,
    needs: all.filter(x => x.submissionStatus === 'needs_changes').length,
  };
  const stats = [
    { label: 'إجمالي الطلبات', value: counts.total, color: 'bg-slate-100 text-slate-700', border: 'border-slate-200' },
    { label: 'قيد المراجعة', value: counts.pending, color: 'bg-amber-50 text-amber-700', border: 'border-amber-100' },
    { label: 'معتمد', value: counts.approved, color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-100' },
    { label: 'يحتاج تعديل', value: counts.needs, color: 'bg-red-50 text-red-700', border: 'border-red-100' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(s => (
        <div key={s.label} className={`rounded-2xl border ${ s.border } ${ s.color } p-4 text-center`}>
          <div className="text-2xl font-black">{s.value}</div>
          <div className="text-xs font-semibold mt-0.5 opacity-80">{s.label}</div>
        </div>
      ))}
    </div>
  );
};

// --------------------------------------------
// Main Page
// --------------------------------------------
// --------------------------------------------
// --------------------------------------------
// Report Modal Component
// --------------------------------------------
const StatusBadgeText = ({ status }) => {
  const map = {
    approved: { label: 'معتمد', color: 'text-emerald-700 font-bold' },
    pending_review: { label: 'قيد المراجعة', color: 'text-amber-700 font-bold' },
    needs_changes: { label: 'يحتاج تعديل', color: 'text-red-700 font-bold' },
  };
  const s = map[status] || { label: status, color: 'text-slate-600' };
  return <span className={s.color}>{s.label}</span>;
};

const ReportModal = ({ data, user, onClose }) => {

  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');


  const allSubmissions = [
    ...(data.contracts || []).map(x => ({ ...x, type: 'contract', typeLabel: 'عقد' })),
    ...(data.expenses || []).map(x => ({ ...x, type: 'expense', typeLabel: 'مصروف' })),
    ...(data.fundings || []).map(x => ({ ...x, type: 'funding', typeLabel: 'تمويل' })),
    ...(data.transactions || []).map(x => ({ ...x, type: 'transaction', typeLabel: 'دفعة' }))
  ];

  // Filter based on status filter
  const filteredSubmissions = statusFilter === 'all'
    ? allSubmissions
    : allSubmissions.filter(s => s.submissionStatus === statusFilter);

  // Project options derived from submissions
  const projectOptions = Array.from(new Set(allSubmissions.map(item => item.projectId?.title).filter(Boolean)));

  // Filter based on selected project
  const projectFiltered = selectedProject === 'all'
    ? filteredSubmissions
    : filteredSubmissions.filter(item => (item.projectId?.title || 'عمليات عامة / غير محددة') === selectedProject);

  // Grouping by project:
  const grouped = {};
  projectFiltered.forEach(item => {
    const projId = item.projectId?._id || 'other';
    const projTitle = item.projectId?.title || 'عمليات عامة / غير محددة';
    if (!grouped[projId]) {
      grouped[projId] = {
        title: projTitle,
        expenses: [],
        contracts: [],
        fundings: [],
        transactions: []
      };
    }
    if (item.type === 'expense') grouped[projId].expenses.push(item);
    else if (item.type === 'contract') grouped[projId].contracts.push(item);
    else if (item.type === 'funding') grouped[projId].fundings.push(item);
    else if (item.type === 'transaction') grouped[projId].transactions.push(item);
  });

  const stats = {
    total: allSubmissions.length,
    approved: allSubmissions.filter(s => s.submissionStatus === 'approved').length,
    pending: allSubmissions.filter(s => s.submissionStatus === 'pending_review').length,
    needsChanges: allSubmissions.filter(s => s.submissionStatus === 'needs_changes').length,
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print-report-modal-backdrop print:bg-white print:p-0 print:static print:inset-auto print:z-auto" onClick={onClose}>
      <div className="relative bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden print-report-modal print:shadow-none print:rounded-none print:w-full print:max-h-full print:static" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-slate-100 bg-white gap-4 print:hidden">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">تقرير حالات الرفع للمدير المالي</h3>
            <p className="text-sm text-slate-500 mt-0.5">عرض وملخص كافة طلبات الاعتمادات والرفع المالي</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">تصفية حسب الحالة:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">الكل ({stats.total})</option>
                  <option value="approved">معتمد ({stats.approved})</option>
                  <option value="pending_review">قيد المراجعة ({stats.pending})</option>
                  <option value="needs_changes">يحتاج تعديل ({stats.needsChanges})</option>
                </select>
              </div>
              {/* Project Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">تصفية حسب المشروع:</span>
                <select
                  value={selectedProject}
                  onChange={e => setSelectedProject(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">الكل</option>
                  {projectOptions.map((proj, idx) => (
                    <option key={idx} value={proj}>{proj}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md"
            >
              <Printer size={16} />
              طباعة التقرير / حفظ PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
              <X size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 print:overflow-visible print:p-0 print:bg-white print:text-black">
          {/* Print Only Header */}
          <div className="hidden print:block text-center border-b-2 border-slate-800 pb-6 mb-6">
            <h1 className="text-2xl font-bold text-slate-900">جهاز مشروعات الخدمة الوطنية</h1>
            <h2 className="text-xl font-bold text-slate-700 mt-1">تقرير حالات الرفع والاعتمادات المالية</h2>
            <div className="flex justify-between text-xs text-slate-500 mt-4" dir="rtl">
              <span><b>مُصدر التقرير:</b> {user?.name || 'المدير المالي'}</span>
              <span><b>تاريخ الإصدار:</b> {new Date().toLocaleString('ar-EG')}</span>
            </div>
          </div>

          {/* Info Summary Grid */}
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-white border border-slate-200 rounded-xl print:border-slate-300">
              <div className="text-xl font-bold text-slate-800">{stats.total}</div>
              <div className="text-xs text-slate-500 font-semibold mt-0.5">إجمالي الطلبات</div>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 print:border-slate-300">
              <div className="text-xl font-bold">{stats.approved}</div>
              <div className="text-xs font-semibold mt-0.5">معتمد</div>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 print:border-slate-300">
              <div className="text-xl font-bold">{stats.pending}</div>
              <div className="text-xs font-semibold mt-0.5">قيد المراجعة</div>
            </div>
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-800 print:border-slate-300">
              <div className="text-xl font-bold">{stats.needsChanges}</div>
              <div className="text-xs font-semibold mt-0.5">يحتاج تعديل</div>
            </div>
          </div>

          {/* Grouped Content by Project */}
          <div className="space-y-6">
            {Object.keys(grouped).length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-white border border-slate-200 rounded-2xl">
                لا توجد عمليات مطابقة لحالة التصفية المختارة.
              </div>
            ) : (
              Object.values(grouped).map((proj, pIdx) => (
                <div key={pIdx} className="border border-slate-200 rounded-2xl p-6 bg-white space-y-4 shadow-sm print:shadow-none print:border-slate-300 print:p-0 print:border-none page-break-inside-avoid">
                  <h4 className="text-base font-extrabold text-blue-800 border-r-4 border-blue-600 pr-3 pb-1 print:text-black print:border-slate-800">
                    {proj.title}
                  </h4>

                  {/* Expenses */}
                  {proj.expenses.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-slate-500 pr-2">المصروفات</h5>
                      <div className="overflow-x-auto border border-slate-100 rounded-xl print:border-slate-200">
                        <table className="w-full text-xs text-right text-slate-600 border-collapse">
                          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-100 print:bg-slate-100">
                            <tr>
                              <th className="px-3 py-2 border-l border-slate-100 text-right">التاريخ</th>
                              <th className="px-3 py-2 border-l border-slate-100 text-right">البند</th>
                              <th className="px-3 py-2 border-l border-slate-100 text-right">المورد</th>
                              <th className="px-3 py-2 border-l border-slate-100 text-right">المبلغ</th>
                              <th className="px-3 py-2 text-right">الحالة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {proj.expenses.map((exp, idx) => (
                              <tr key={exp._id || idx} className="border-b border-slate-100">
                                <td className="px-3 py-2 border-l border-slate-100">{new Date(exp.createdAt).toLocaleDateString('ar-EG')}</td>
                                <td className="px-3 py-2 border-l border-slate-100">{exp.category}</td>
                                <td className="px-3 py-2 border-l border-slate-100">{exp.vendor || '—'}</td>
                                <td className="px-3 py-2 border-l border-slate-100 font-semibold">{formatCurrencyVal(exp.amount, exp.currency)}</td>
                                <td className="px-3 py-2"><StatusBadgeText status={exp.submissionStatus} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Contracts */}
                  {proj.contracts.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-slate-500 pr-2">العقود</h5>
                      <div className="overflow-x-auto border border-slate-100 rounded-xl print:border-slate-200">
                        <table className="w-full text-xs text-right text-slate-600 border-collapse">
                          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-100 print:bg-slate-100">
                            <tr>
                              <th className="px-3 py-2 border-l border-slate-100 text-right">التاريخ</th>
                              <th className="px-3 py-2 border-l border-slate-100 text-right">المقاول</th>
                              <th className="px-3 py-2 border-l border-slate-100 text-right">قيمة العقد</th>
                              <th className="px-3 py-2 border-l border-slate-100 text-right">المدفوع</th>
                              <th className="px-3 py-2 text-right">الحالة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {proj.contracts.map((con, idx) => (
                              <tr key={con._id || idx} className="border-b border-slate-100">
                                <td className="px-3 py-2 border-l border-slate-100">{new Date(con.createdAt).toLocaleDateString('ar-EG')}</td>
                                <td className="px-3 py-2 border-l border-slate-100">{con.contractorName}</td>
                                <td className="px-3 py-2 border-l border-slate-100 font-semibold">{renderMultiCurrency(con.values, con.contractValue)}</td>
                                <td className="px-3 py-2 border-l border-slate-100">{renderMultiCurrency(con.paidAmounts, con.paidAmount)}</td>
                                <td className="px-3 py-2"><StatusBadgeText status={con.submissionStatus} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Funding Sources and Transactions */}
                  {(proj.fundings.length > 0 || proj.transactions.length > 0) && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-slate-500 pr-2">مصادر التمويل والمدفوعات</h5>
                      <div className="overflow-x-auto border border-slate-100 rounded-xl print:border-slate-200">
                        <table className="w-full text-xs text-right text-slate-600 border-collapse">
                          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-100 print:bg-slate-100">
                            <tr>
                              <th className="px-3 py-2 border-l border-slate-100 text-right">التاريخ</th>
                              <th className="px-3 py-2 border-l border-slate-100 text-right">النوع</th>
                              <th className="px-3 py-2 border-l border-slate-100 text-right">البيان</th>
                              <th className="px-3 py-2 border-l border-slate-100 text-right">المبلغ</th>
                              <th className="px-3 py-2 text-right">الحالة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {proj.fundings.map((fun, idx) => (
                              <tr key={`fun-${idx}`} className="border-b border-slate-100">
                                <td className="px-3 py-2 border-l border-slate-100">{new Date(fun.createdAt).toLocaleDateString('ar-EG')}</td>
                                <td className="px-3 py-2 border-l border-slate-100"><span className="text-emerald-700 font-semibold">مصدر تمويل</span></td>
                                <td className="px-3 py-2 border-l border-slate-100">{fun.sourceName}</td>
                                <td className="px-3 py-2 border-l border-slate-100 font-semibold">{formatCurrencyVal(fun.committedAmount, fun.currency)}</td>
                                <td className="px-3 py-2"><StatusBadgeText status={fun.submissionStatus} /></td>
                              </tr>
                            ))}
                            {proj.transactions.map((tr, idx) => (
                              <tr key={`tr-${idx}`} className="border-b border-slate-100">
                                <td className="px-3 py-2 border-l border-slate-100">{new Date(tr.createdAt).toLocaleDateString('ar-EG')}</td>
                                <td className="px-3 py-2 border-l border-slate-100"><span className="text-purple-700 font-semibold">دفعة مستلمة</span></td>
                                <td className="px-3 py-2 border-l border-slate-100">{tr.fundingSourceId?.sourceName || '—'} ({tr.paymentMethod})</td>
                                <td className="px-3 py-2 border-l border-slate-100 font-semibold">{fmt(tr.amount)} ج.م</td>
                                <td className="px-3 py-2"><StatusBadgeText status={tr.submissionStatus} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              html, body, #root, #root > div {
                height: auto !important;
                overflow: visible !important;
                max-height: none !important;
              }
              body * {
                visibility: hidden;
              }
              .print-report-modal, .print-report-modal * {
                visibility: visible !important;
              }
              .print-report-modal {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                max-height: none !important;
                overflow: visible !important;
                background: white !important;
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .print-report-modal-backdrop {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                background: white !important;
                backdrop-filter: none !important;
              }
            }
          `}} />
        </div>
      </div>
    </div>
  );
};

export default function SubmissionsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-submissions');
  const [submissions, setSubmissions] = useState({ contracts: [], expenses: [], fundings: [], progress: [], transactions: [] });
  const [pendingSubmissions, setPendingSubmissions] = useState({ contracts: [], expenses: [], fundings: [], progress: [], transactions: [] });
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const canReview = ['Admin', 'Super Admin', 'Reviewer'].includes(user?.role);
  const canSubmit = ['Admin', 'Super Admin', 'Financial Manager', 'Engineering Manager'].includes(user?.role);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (canSubmit) {
        const myData = await getMySubmissions();
        setSubmissions(myData.data || { contracts: [], expenses: [], fundings: [], progress: [], transactions: [] });
      }
      if (canReview) {
        const pendingData = await getPendingSubmissions();
        setPendingSubmissions(pendingData.data || { contracts: [], expenses: [], fundings: [], progress: [], transactions: [] });
      }
    } catch {
      toast.error('حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canReview && !canSubmit) setActiveTab('pending');
    fetchData();
  }, [user]);

  const handleReview = async (type, id, action, reason) => {
    try {
      await reviewSubmission(type, id, { action, rejectionReason: reason });
      toast.success(action === 'approve' ? '✅ تم الاعتماد بنجاح' : '🔁 تم طلب التعديل');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء العملية');
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الطلب نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }
    try {
      await deleteSubmission(type, id);
      toast.success('🗑️ تم حذف الطلب بنجاح');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء حذف الطلب');
    }
  };

  const openReview = (item, type) => setReviewTarget({ item, type });
  const closeReview = () => setReviewTarget(null);
  const openEdit = (item, type) => setEditTarget({ item, type });
  const closeEdit = () => setEditTarget(null);

  const currentData = activeTab === 'my-submissions' ? submissions : pendingSubmissions;
  const isReviewTab = activeTab === 'pending';

  const hasAnyData = (d) =>
    d.contracts?.length || d.expenses?.length || d.fundings?.length || d.progress?.length || d.transactions?.length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <RefreshCw className="animate-spin text-blue-500" size={36} />
        <span className="text-slate-500 text-sm">جاري تحميل البيانات...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">مراجعة المدخلات</h1>
          <p className="text-slate-500 text-sm mt-1">إدارة الطلبات واعتماد البيانات</p>
        </div>
        <div className="flex items-center gap-3">
          {canSubmit && (
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md"
            >
              <FileText size={15} />
              توليد تقرير حالات الرفع
            </button>
          )}
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <RefreshCw size={15} />
            تحديث
          </button>
        </div>
      </div>

      <StatsBar data={currentData} />

      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        {canSubmit && (
          <button
            onClick={() => setActiveTab('my-submissions')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${ activeTab === 'my-submissions'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            طلباتي
          </button>
        )}
        {canReview && (
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${ activeTab === 'pending'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            بانتظار المراجعة
            {pendingSubmissions && hasAnyData(pendingSubmissions) && (
              <span className="w-5 h-5 bg-amber-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                {(pendingSubmissions.contracts?.length || 0) + (pendingSubmissions.expenses?.length || 0) + (pendingSubmissions.fundings?.length || 0) + (pendingSubmissions.progress?.length || 0) + (pendingSubmissions.transactions?.length || 0)}
              </span>
            )}
          </button>
        )}
      </div>

      <div className="space-y-8">
        {!hasAnyData(currentData) ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <FileSignature size={32} className="text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-700 text-lg">لا توجد سجلات</h3>
            <p className="text-slate-400 text-sm max-w-xs">
              {isReviewTab ? 'لا توجد طلبات بانتظار مراجعتك في الوقت الحالي.' : 'لم تقم بإرسال أي طلبات بعد.'}
            </p>
          </div>
        ) : (
          <>
            <Section items={currentData.contracts} type="contract" isReviewTab={isReviewTab} onReview={openReview} onEdit={openEdit} onDelete={handleDelete} />
            <Section items={currentData.expenses} type="expense" isReviewTab={isReviewTab} onReview={openReview} onEdit={openEdit} onDelete={handleDelete} />
            <Section items={currentData.fundings} type="funding" isReviewTab={isReviewTab} onReview={openReview} onEdit={openEdit} onDelete={handleDelete} />
            <Section items={currentData.progress} type="progress" isReviewTab={isReviewTab} onReview={openReview} onEdit={openEdit} onDelete={handleDelete} />
            <Section items={currentData.transactions} type="transaction" isReviewTab={isReviewTab} onReview={openReview} onEdit={openEdit} onDelete={handleDelete} />
          </>
        )}
      </div>

      {reviewTarget && (
        <ReviewModal
          item={reviewTarget.item}
          type={reviewTarget.type}
          onClose={closeReview}
          onAction={handleReview}
        />
      )}

      {editTarget && (
        <EditSubmissionModal
          item={editTarget.item}
          type={editTarget.type}
          onClose={closeEdit}
          onSaved={fetchData}
        />
      )}

      {showReportModal && (
        <ReportModal
          data={submissions}
          user={user}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}