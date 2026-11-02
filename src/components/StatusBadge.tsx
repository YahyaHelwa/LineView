import type { StationStatus } from '../types'

const LABELS: Record<StationStatus, string> = {
  running: 'Running',
  idle: 'Idle',
  down: 'Down',
  maintenance: 'Maintenance',
}

export function StatusBadge({ status }: { status: StationStatus }) {
  return (
    <span className={`badge badge--${status}`}>
      <span className="badge__dot" aria-hidden="true" />
      {LABELS[status]}
    </span>
  )
}

export const STATUS_LABELS = LABELS
