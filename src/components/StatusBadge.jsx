import { STATUS_COLORS } from '../data/mockData'
import clsx from 'clsx'

export default function StatusBadge({ status }) {
  const cfg = STATUS_COLORS[status] || STATUS_COLORS['مخطط']
  return (
    <span className={clsx('badge', cfg.bg, cfg.text)}>
      <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
            style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}
