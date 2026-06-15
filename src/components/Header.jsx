import { useState, useEffect, useRef } from 'react'
import { Bell, Search, ChevronLeft, AlertTriangle, Clock } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMySubmissions, getPendingSubmissions } from '../api/submissionApi'

const PAGE_TITLES = {
  '/dashboard': { title: 'لوحة التحكم الرئيسية', sub: 'نظرة عامة على المشروعات الوطنية' },
  '/projects': { title: 'المشروعات', sub: 'قائمة جميع المشروعات' },
  '/sectors': { title: 'القطاعات', sub: 'إدارة وتصنيف القطاعات' },
  '/funding': { title: 'مصادر التمويل', sub: 'تتبع مصادر تمويل المشروعات' },
  '/map': { title: 'خريطة المشروعات الجغرافية', sub: 'توزيع المشروعات على الخريطة' },
  '/reports': { title: 'التقارير', sub: 'التقارير والتحليلات' },
  '/settings': { title: 'الإعدادات', sub: 'إعدادات النظام والحساب' },
  '/submissions': { title: 'مراجعة المدخلات', sub: 'إدارة الطلبات واعتماد البيانات' },
}

const playNotificationChime = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      return false;
    }

    const playTone = (freq, startTime, duration) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gainNode.gain.setValueAtTime(0.15, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = audioCtx.currentTime;
    playTone(523.25, now, 0.3);        // C5
    playTone(659.25, now + 0.12, 0.3); // E5
    playTone(783.99, now + 0.24, 0.4); // G5
    return true;
  } catch (error) {
    console.warn('Audio playback failed or was blocked by browser autoplay policy:', error);
    return false;
  }
};

export default function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const chimeIntervalRef = useRef(null)

  const base = '/' + pathname.split('/')[1]
  const info = PAGE_TITLES[base] || { title: 'منصة المشروعات', sub: '' }

  // Start chime loop if there are unacknowledged notifications
  const triggerChimeSystem = (items) => {
    if (isOpen || items.length === 0) {
      if (chimeIntervalRef.current) {
        clearInterval(chimeIntervalRef.current)
        chimeIntervalRef.current = null
      }
      return
    }

    const prevIds = JSON.parse(sessionStorage.getItem('notified_submission_ids') || '[]')
    const currentIds = items.map(x => x.id)
    const hasNew = currentIds.some(id => !prevIds.includes(id))

    if (hasNew) {
      const startLoop = () => {
        if (chimeIntervalRef.current) clearInterval(chimeIntervalRef.current)

        const success = playNotificationChime()
        if (success) {
          chimeIntervalRef.current = setInterval(() => {
            playNotificationChime()
          }, 6000)
        } else {
          // If autoplay blocked, wait for user interaction to resume
          const resumeOnInteraction = () => {
            const successNow = playNotificationChime()
            if (successNow) {
              chimeIntervalRef.current = setInterval(() => {
                playNotificationChime()
              }, 6000)
              window.removeEventListener('click', resumeOnInteraction)
              window.removeEventListener('keydown', resumeOnInteraction)
            }
          }
          window.addEventListener('click', resumeOnInteraction)
          window.addEventListener('keydown', resumeOnInteraction)
        }
      }
      startLoop()
    }
  }

  useEffect(() => {
    if (!user) return

    const fetchNotifications = async () => {
      try {
        const isReviewer = ['Admin', 'Super Admin', 'Reviewer'].includes(user?.role)
        const isSubmitter = ['Admin', 'Super Admin', 'Financial Manager', 'Engineering Manager'].includes(user?.role)

        let myItems = []
        let pendingItems = []

        if (isSubmitter) {
          const res = await getMySubmissions()
          if (res?.data) {
            const { contracts, expenses, fundings, progress, transactions } = res.data
            const checkAndAdd = (list, type, label) => {
              if (!list) return
              list.forEach(item => {
                if (item.submissionStatus === 'needs_changes') {
                  myItems.push({
                    id: item._id,
                    type,
                    typeLabel: label,
                    projectTitle: item.projectId?.title || 'مشروع غير معروف',
                    reason: item.rejectionReason || 'يرجى مراجعة وتعديل البيانات',
                    date: item.updatedAt || item.createdAt,
                    status: 'needs_changes'
                  })
                }
              })
            }
            checkAndAdd(contracts, 'contract', 'عقد')
            checkAndAdd(expenses, 'expense', 'مصروف')
            checkAndAdd(fundings, 'funding', 'مصدر تمويل')
            checkAndAdd(progress, 'progress', 'نسبة إنجاز')
            checkAndAdd(transactions, 'transaction', 'دفعة تمويلية')
          }
        }

        if (isReviewer) {
          const res = await getPendingSubmissions()
          if (res?.data) {
            const { contracts, expenses, fundings, progress, transactions } = res.data
            const checkAndAdd = (list, type, label) => {
              if (!list) return
              list.forEach(item => {
                if (item.submissionStatus === 'pending_review') {
                  pendingItems.push({
                    id: item._id,
                    type,
                    typeLabel: label,
                    projectTitle: item.projectId?.title || 'مشروع غير معروف',
                    reason: 'طلب جديد بانتظار المراجعة والاعتماد',
                    date: item.createdAt,
                    status: 'pending_review'
                  })
                }
              })
            }
            checkAndAdd(contracts, 'contract', 'عقد')
            checkAndAdd(expenses, 'expense', 'مصروف')
            checkAndAdd(fundings, 'funding', 'مصدر تمويل')
            checkAndAdd(progress, 'progress', 'نسبة إنجاز')
            checkAndAdd(transactions, 'transaction', 'دفعة تمويلية')
          }
        }

        const combinedItems = [...myItems, ...pendingItems]
        combinedItems.sort((a, b) => new Date(b.date) - new Date(a.date))

        setNotifications(combinedItems)
        triggerChimeSystem(combinedItems)
      } catch (err) {
        console.error('Error fetching notifications:', err)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen) {
      if (chimeIntervalRef.current) {
        clearInterval(chimeIntervalRef.current)
        chimeIntervalRef.current = null
      }
      if (notifications.length > 0) {
        const currentIds = notifications.map(x => x.id)
        sessionStorage.setItem('notified_submission_ids', JSON.stringify(currentIds))
      }
    }
  }, [isOpen, notifications])

  useEffect(() => {
    return () => {
      if (chimeIntervalRef.current) {
        clearInterval(chimeIntervalRef.current)
      }
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100
                       flex items-center justify-between px-6 py-3.5 gap-4">
      <div>
        <h1 className="text-lg font-bold text-gray-800 leading-tight">{info.title}</h1>
        {info.sub && <p className="text-xs text-gray-400 mt-0.5">{info.sub}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="بحث..."
            className="input pr-9 w-52 text-sm py-2"
          />
        </div>

        {/* Notifications Button & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`relative rounded-2xl flex items-center justify-center transition-all duration-300 ${ notifications.length > 0
                ? 'w-12 h-12 bg-red-50 hover:bg-red-100 text-red-600 border-2 border-red-300 shadow-md shadow-red-100 hover:scale-105'
                : 'w-10 h-10 bg-gray-50 hover:bg-gray-100 text-gray-500'
              }`}
          >
            <Bell
              size={notifications.length > 0 ? 24 : 20}
              className={notifications.length > 0 ? 'animate-ring text-red-600' : 'text-gray-500'}
            />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger border-2 border-white rounded-full animate-pulse-glow" />
            )}
          </button>

          {isOpen && (
            <div
              className="absolute left-0 mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-navy-lg z-50 overflow-hidden animate-fade-in-up"
              style={{ top: '100%' }}
            >
              <div className="p-4 border-b border-gray-50 bg-slate-50 flex items-center justify-between">
                <span className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                  <Bell size={16} className="text-primary" />
                  تنبيهات النظام
                </span>
                {notifications.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                    {notifications.length} تنبيهات نشطة
                  </span>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-xs">
                    لا توجد إشعارات جديدة حالياً
                  </div>
                ) : (
                  notifications.map((item) => {
                    const isNeedsChanges = item.status === 'needs_changes';
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          navigate('/submissions');
                          setIsOpen(false);
                        }}
                        className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors text-right flex gap-3 items-start border-r-4 ${ isNeedsChanges ? 'border-red-500' : 'border-amber-500'
                          }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${ isNeedsChanges ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'
                          }`}>
                          {isNeedsChanges ? <AlertTriangle size={15} /> : <Clock size={15} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${ isNeedsChanges ? 'text-red-600 bg-red-50/50' : 'text-amber-700 bg-amber-50/50'
                              }`}>
                              {isNeedsChanges ? `طلب ${ item.typeLabel } مرفوض` : `طلب ${ item.typeLabel } جديد`}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(item.date).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-gray-700 mt-1 truncate">{item.projectTitle}</h4>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                            <b>{isNeedsChanges ? 'السبب:' : 'البيان:'}</b> {item.reason}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="p-2 border-t border-gray-50 bg-slate-50 text-center">
                <button
                  onClick={() => {
                    navigate('/submissions');
                    setIsOpen(false);
                  }}
                  className="text-xs font-bold text-primary hover:text-primary-600 transition-colors w-full py-1.5"
                >
                  عرض جميع الطلبات
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Date */}
        <div className="hidden lg:block text-left">
          <p className="text-xs font-semibold text-gray-700">
            {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </header>
  )
}

