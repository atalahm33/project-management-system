import clsx from 'clsx'

export default function ProgressBar({ value, color, size = 'md', showLabel = false }) {
  const h = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2'
  const bg = value >= 80 ? '#2ECC71' : value >= 50 ? '#F39C12' : value >= 30 ? '#E67E22' : '#E74C3C'

  return (
    <div className="flex items-center gap-2">
      <div className={clsx('progress-bar flex-1', h)}>
        <div
          className="progress-fill"
          style={{ width: `${Math.min(value, 100)}%`, background: color || bg }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-gray-600 w-9 text-left">{value}%</span>
      )}
    </div>
  )
}
