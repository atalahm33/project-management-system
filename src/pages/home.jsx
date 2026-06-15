import { useNavigate } from 'react-router-dom'
import { BarChart3, Clock, FileText, ArrowLeft, Shield, Globe2, CheckCircle2, TrendingUp, AlertTriangle, FolderOpen } from 'lucide-react'

const features = [
  {
    icon: <BarChart3 size={26} />,
    color: 'blue',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-100',
    title: 'إحصائيات وتحليلات',
    desc: 'لوحة بيانات تفاعلية تعرض مؤشرات الأداء الرئيسية، توزيع الميزانيات، ونسب الإنجاز لكافة المشروعات بشكل لحظي.',
  },
  {
    icon: <AlertTriangle size={26} />,
    color: 'amber',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-100',
    title: 'رصد المشروعات المتأخرة',
    desc: 'نظام تنبيه ذكي يرصد ويصنّف المشروعات المتأخرة عن جدولها الزمني ويرفع التقارير الفورية لأصحاب القرار.',
  },
  {
    icon: <FileText size={26} />,
    color: 'indigo',
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-indigo-100',
    title: 'نظام التقارير',
    desc: 'إصدار تقارير PDF وExcel شاملة للقطاعات ومصادر التمويل والمقاولين، جاهزة للرفع الرسمي.',
  },
  {
    icon: <TrendingUp size={26} />,
    color: 'emerald',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-100',
    title: 'متابعة التمويل والصرف',
    desc: 'تتبع دقيق لمصادر التمويل والمبالغ المصروفة والمتبقية مع سجل تاريخي كامل لكل معاملة مالية.',
  },

  {
    icon: <Shield size={26} />,
    color: 'purple',
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-100',
    title: 'إدارة الصلاحيات',
    desc: 'نظام متعدد المستويات يضمن وصول كل مستخدم للبيانات المصرح له بها فقط بأمان تام.',
  },
]

const stats = [
  { value: '+١٢٠', label: 'مشروع قيد التنفيذ' },
  { value: '+٢٥', label: 'قطاع حيوي' },
  { value: '٩٨٪', label: 'دقة البيانات' },
  { value: '+٥٠', label: 'جهة مستفيدة' },
]

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden" dir="rtl">

      {/* ── HERO (Full Screen National) ── */}
      <section className="relative w-full min-h-screen flex flex-col overflow-hidden" dir="rtl">

        {/* ── Dark gradient background ── */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d1f3c] to-[#0a0f1e] z-0"></div>

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 z-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '60px 60px' }}>
        </div>

        {/* Glowing orbs */}
        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[70%] bg-blue-700/20 blur-[130px] rounded-full pointer-events-none z-0"></div>
        <div className="absolute bottom-[-15%] left-[-5%] w-[40%] h-[60%] bg-indigo-800/20 blur-[130px] rounded-full pointer-events-none z-0"></div>

        {/* ── LOGO WATERMARK – Left Side ── */}
        <div className="absolute inset-y-0 left-0 w-1/2 flex items-center justify-center z-0 pointer-events-none">
          <img
            src="/images/NSPO-Logo.png"
            alt=""
            aria-hidden="true"
            className="w-[560px] h-[560px] object-contain opacity-[0.07] animate-float-logo select-none"
          />
        </div>

        {/* ── NAVBAR ── */}
        <nav className="relative z-20 flex items-center justify-between px-8 lg:px-16 py-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <img src="/images/NSPO-Logo.png" alt="NSPO Logo" className="h-14 w-auto object-contain drop-shadow-lg" />
            <div className="flex flex-col leading-tight">
              <span className="text-white font-extrabold text-base tracking-tight">جهاز مشروعات الخدمة الوطنية</span>
              <span className="text-blue-400 text-xs font-semibold tracking-wide">بوابة إدارة مشاريع الجهاز</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all text-sm font-bold text-white flex items-center gap-2 group"
          >
            تسجيل الدخول
            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
          </button>
        </nav>

        {/* ── HERO CONTENT ── */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 lg:px-20 py-20">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-blue-500/30 backdrop-blur-sm text-blue-300 text-sm mb-10 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400"></span>
            </span>
            المنصة الرقمية لمتابعة مشروعات  • 2026
          </div>

          {/* Main heading */}
          <h1 className="text-5xl lg:text-7xl xl:text-8xl font-extrabold text-white leading-[1.1] mb-6 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <span className="block text-transparent bg-clip-text bg-gradient-to-l from-blue-300 via-white to-indigo-200">
              جهاز مشروعات
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-l from-amber-300 via-orange-200 to-yellow-200">
              الخدمة الوطنية
            </span>
          </h1>

          {/* Subtitle */}
          <div
            className="max-w-2xl mb-12 animate-fade-in-up"
            style={{ animationDelay: '300ms' }}
          >
            <p className="text-blue-100 text-xl lg:text-2xl font-bold leading-relaxed">
              منصة متكاملة لإدارة ومتابعة المشروعات
            </p>

            <p className="text-blue-200/80 text-lg lg:text-xl leading-relaxed mt-3">
              رصد الإنجاز → الموقف التنفيذي → إصدار التقارير → الدعم واتخاذ القرار            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-5 animate-fade-in-up" style={{ animationDelay: '450ms' }}>
            <button
              onClick={() => navigate('/login')}
              className="px-10 py-4 rounded-2xl bg-gradient-to-l from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-extrabold text-lg shadow-2xl shadow-blue-900/60 transition-all hover:scale-105"
            >
              ابدأ الآن
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-10 py-4 rounded-2xl bg-white/8 hover:bg-white/15 border border-white/20 backdrop-blur-sm text-white font-bold text-lg transition-all hover:scale-105"
            >
              استكشف المنصة
            </button>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-12 mt-20 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
            {[
              { value: '+30', label: 'مشروع' },
              { value: '+5', label: 'قطاع' },
              { value: '98%', label: 'دقة البيانات' },
              { value: '+20', label: 'جهة مستفيدة' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-extrabold text-white">{s.value}</p>
                <p className="text-blue-300/70 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom fade to light background */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-slate-50 z-10 pointer-events-none"></div>
      </section>


      {/* ── FEATURES GRID ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pb-20 pt-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">خدمات المنصة</h2>
          <p className="text-slate-500 max-w-xl mx-auto">منظومة متكاملة من الأدوات الرقمية لإدارة ومتابعة المشروعات  بكفاءة عالية</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className={`bg-white rounded-2xl border ${f.border} p-7 hover:shadow-lg transition-all hover:-translate-y-1 duration-300`}
            >
              <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-5 ${f.text}`}>
                {f.icon}
              </div>
              <h3 className="text-slate-800 font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BUILDING IMAGE SECTION ── */}
      <section className="relative z-10 w-full px-0 pb-16">
        <div className="relative w-full h-[480px] lg:h-[580px] overflow-hidden">
          {/* Building image */}
          <img
            src="/images/NSPObuilding03.webp"
            alt="مبنى الجهاز الوطني للمشروعات"
            className="w-full h-full object-cover object-center"
            style={{
              animation: 'building-reveal 1.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards, building-breathe 14s 1.4s ease-in-out infinite',
              opacity: 0
            }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-transparent"></div>

          {/* Text overlay */}
          <div className="absolute bottom-0 right-0 left-0 p-10 lg:p-16 text-right" dir="rtl">
            <p className="text-blue-300 text-sm font-semibold mb-2 tracking-widest uppercase">جهاز مشروعات الخدمة الوطنية</p>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 drop-shadow-lg leading-tight">
              المقر الرئيسي<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">للجهاز</span>
            </h2>
            <p className="text-slate-300 text-base max-w-xl leading-relaxed">
              منصة متكاملة لإدارة ومتابعة مشروعات جهاز مشروعات الخدمة الوطنية، تتيح مراقبة سير العمل، إدارة الموارد والتمويل، وتتبع نسب الإنجاز لحظيًا، بما يضمن أعلى مستويات الكفاءة والشفافية ودعم اتخاذ القرار.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 pb-20">
        <div className="bg-gradient-to-l from-blue-600 to-indigo-600 rounded-3xl p-12 text-center text-white shadow-2xl shadow-blue-300/30">

          <h2 className="text-3xl font-extrabold mb-4">
            منصة إدارة ومتابعة المشروعات
          </h2>

          <p className="text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            نظام رقمي متكامل يوفّر متابعة دقيقة للمشروعات التابعة لجهاز مشروعات الخدمة الوطنية،
            مع دعم إدارة التمويل، مراقبة نسب التنفيذ، وتحليل البيانات لدعم اتخاذ القرار بكفاءة وشفافية.
          </p>

          <button
            onClick={() => navigate('/login')}
            className="px-10 py-4 rounded-xl bg-white text-blue-700 font-extrabold text-lg shadow-lg hover:scale-105 transition-transform"
          >
            الدخول إلى المنصة
          </button>

        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-slate-200 bg-white py-8 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-3">
            <img src="/images/NSPO-Logo.png" alt="Logo" className="h-10 w-auto object-contain" />
            <span> Nspo it solution</span>
          </div>
          <p>جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
        </div>
      </footer>

      <style>{`
        .perspective-1000 { perspective: 1200px; }
        .preserve-3d { transform-style: preserve-3d; }

        /* Hero logo float */
        @keyframes float-logo {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-10px) scale(1.04); }
        }
        .animate-float-logo {
          animation: float-logo 4s ease-in-out infinite;
        }

        /* Rotating dashed ring */
        @keyframes spin-ring {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .animate-spin-ring {
          animation: spin-ring 12s linear infinite;
        }

        /* Pulse glow */
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.25; transform: scale(1.4); }
          50%       { opacity: 0.55; transform: scale(1.65); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3.5s ease-in-out infinite;
        }

        /* 3D float scene */
        @keyframes float-scene {
          0%   { transform: rotateY(0deg) translateY(0px); }
          50%  { transform: rotateY(4deg) translateY(-18px); }
          100% { transform: rotateY(0deg) translateY(0px); }
        }
        .animate-float-scene { animation: float-scene 9s ease-in-out infinite; }

        /* Fade in up */
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.75s ease-out forwards;
          opacity: 0;
        }

        /* Building image reveal — slow zoom-in from slightly enlarged */
        @keyframes building-reveal {
          0%   { opacity: 0; transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-building-reveal {
          animation: building-reveal 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
        }

        /* Subtle continuous parallax breathe on the building */
        @keyframes building-breathe {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.03); }
        }
        .animate-building-breathe {
          animation: building-breathe 12s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
